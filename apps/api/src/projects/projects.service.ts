import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Action, ActivityType, DEFAULT_LISTS, ErrorCode, StatusType } from '@qcc/shared';
import { ActivitiesService } from '../activities/activities.service';
import type { Actor } from '../common/actor';
import { AppException, notFound } from '../common/app-exception';
import { toObjectId } from '../common/object-id';
import { positionBetween } from '../common/position';
import { ClientsService } from '../clients/clients.service';
import { MembersService } from '../members/members.service';
import { PolicyService } from '../permissions/policy.service';
import { List } from './list.schema';
import {
  CreateProjectDto,
  ListProjectsQuery,
  RenameListDto,
  SetLeadersDto,
  SetMembersDto,
  UpdateProjectDto,
} from './project.dto';
import { Project, ProjectDocument } from './project.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projects: Model<Project>,
    @InjectModel(List.name) private readonly lists: Model<List>,
    private readonly clients: ClientsService,
    private readonly members: MembersService,
    private readonly policy: PolicyService,
    private readonly activities: ActivitiesService,
  ) {}

  list(actor: Actor, query: ListProjectsQuery) {
    this.policy.assert(actor, Action.ProjectView);
    const filter: Record<string, unknown> = { workspaceId: actor.workspaceId };
    if (query.clientId) filter.clientId = query.clientId;
    if (query.includeArchived !== 'true') filter.archived = false;
    if (query.mine === 'true') {
      filter.$or = [{ leaderIds: actor.memberId }, { memberIds: actor.memberId }];
    }
    return this.projects.find(filter).populate('clientId', 'name logo').sort({ updatedAt: -1 }).lean();
  }

  /** Chi tiết dự án kèm danh sách cột (đã sắp xếp) */
  async getWithLists(actor: Actor, id: string) {
    const project = await this.findOrFail(actor, id);
    this.policy.assert(actor, Action.ProjectView, { project });
    const lists = await this.lists.find({ projectId: project._id }).sort({ position: 1 }).lean();
    return { ...project.toObject(), lists };
  }

  /** Tạo dự án (admin) + tự tạo 8 cột theo quy trình agency */
  async create(actor: Actor, dto: CreateProjectDto) {
    this.policy.assert(actor, Action.ProjectCreate);
    const client = await this.clients.get(actor, dto.clientId);
    const leaderIds = await this.members.assertActiveStaff(actor, dto.leaderIds ?? []);
    const memberIds = await this.members.assertActiveStaff(actor, dto.memberIds ?? []);

    const project = await this.projects.create({
      ...dto,
      workspaceId: new Types.ObjectId(actor.workspaceId),
      clientId: client._id,
      leaderIds,
      memberIds,
    });

    // Sinh vị trí tăng dần cho 8 cột mặc định
    let position: string | null = null;
    const lists = DEFAULT_LISTS.map(({ statusType, name }) => {
      position = positionBetween(position, null);
      return { workspaceId: project.workspaceId, projectId: project._id, name, statusType, position };
    });
    await this.lists.insertMany(lists);

    await this.activities.log(actor, {
      type: ActivityType.ProjectCreated,
      clientId: client._id,
      projectId: project._id,
      data: { name: project.name },
    });
    return this.getWithLists(actor, project.id);
  }

  async update(actor: Actor, id: string, dto: UpdateProjectDto) {
    const project = await this.findOrFail(actor, id);
    this.policy.assert(actor, Action.ProjectUpdate, { project });
    project.set(dto);
    await project.save();
    await this.log(actor, project, ActivityType.ProjectUpdated, { ...dto });
    return project.toObject();
  }

  /** Gán leader (admin) */
  async setLeaders(actor: Actor, id: string, dto: SetLeadersDto) {
    const project = await this.findOrFail(actor, id);
    this.policy.assert(actor, Action.ProjectAssignLeader, { project });
    project.leaderIds = await this.members.assertActiveStaff(actor, dto.leaderIds);
    await project.save();
    await this.log(actor, project, ActivityType.ProjectLeadersChanged, { leaderIds: dto.leaderIds });
    return project.toObject();
  }

  /** Thêm/bớt thành viên (leader) */
  async setMembers(actor: Actor, id: string, dto: SetMembersDto) {
    const project = await this.findOrFail(actor, id);
    this.policy.assert(actor, Action.ProjectManageMembers, { project });
    project.memberIds = await this.members.assertActiveStaff(actor, dto.memberIds);
    await project.save();
    await this.log(actor, project, ActivityType.ProjectMembersChanged, { memberIds: dto.memberIds });
    return project.toObject();
  }

  async setArchived(actor: Actor, id: string, archived: boolean) {
    const project = await this.findOrFail(actor, id);
    this.policy.assert(actor, Action.ProjectArchive, { project });
    project.archived = archived;
    await project.save();
    await this.log(actor, project, ActivityType.ProjectArchived, { archived });
    return project.toObject();
  }

  /** Đổi tên cột (leader). statusType không đổi. */
  async renameList(actor: Actor, projectId: string, listId: string, dto: RenameListDto) {
    const project = await this.findOrFail(actor, projectId);
    this.policy.assert(actor, Action.ProjectUpdate, { project });
    const list = await this.lists
      .findOneAndUpdate(
        { _id: toObjectId(listId, ErrorCode.ListNotFound), projectId: project._id },
        { $set: { name: dto.name } },
        { new: true },
      )
      .lean();
    if (!list) throw notFound(ErrorCode.ListNotFound);
    return list;
  }

  activitiesOf(actor: Actor, id: string) {
    return this.findOrFail(actor, id).then((p) => this.activities.listForProject(actor, p._id));
  }

  // ===== Dùng chung cho TasksService =====

  /** Lấy dự án trong workspace của actor */
  async findOrFail(actor: Actor, id: string | Types.ObjectId): Promise<ProjectDocument> {
    const _id = typeof id === 'string' ? toObjectId(id, ErrorCode.ProjectNotFound) : id;
    const project = await this.projects.findOne({ _id, workspaceId: actor.workspaceId });
    if (!project) throw notFound(ErrorCode.ProjectNotFound);
    return project;
  }

  async findListOrFail(project: ProjectDocument, listId: string | Types.ObjectId) {
    const _id = typeof listId === 'string' ? toObjectId(listId, ErrorCode.ListNotFound) : listId;
    const list = await this.lists.findOne({ _id, projectId: project._id }).lean();
    if (!list) throw notFound(ErrorCode.ListNotFound);
    return list;
  }

  /** Cột đầu tiên có statusType tương ứng (dùng khi workflow tự chuyển cột) */
  async findListByStatus(project: ProjectDocument, statusType: StatusType) {
    const list = await this.lists.findOne({ projectId: project._id, statusType }).sort({ position: 1 }).lean();
    if (!list) throw notFound(ErrorCode.ListNotFound);
    return list;
  }

  assertActive(project: ProjectDocument) {
    if (project.archived) throw new AppException(ErrorCode.ProjectArchived);
  }

  private log(actor: Actor, project: ProjectDocument, type: ActivityType, data: Record<string, unknown>) {
    return this.activities.log(actor, { type, clientId: project.clientId, projectId: project._id, data });
  }
}
