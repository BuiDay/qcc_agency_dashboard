import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Action, ErrorCode, WorkspaceRole } from '@qcc/shared';
import { Model, Types } from 'mongoose';
import { Actor } from '../common/interfaces/actor.interface';
import { PolicyService } from '../common/policy/policy.service';
import { Member } from '../members/schemas/member.schema';
import { AddProjectMembersDto } from './dto/add-project-members.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projects: Model<Project>,
    @InjectModel(Member.name) private readonly members: Model<Member>,
    private readonly policy: PolicyService,
  ) {}

  async create(actor: Actor, dto: CreateProjectDto) {
    this.policy.assertCan(actor, Action.ProjectsCreate, {
      workspaceId: actor.workspaceId,
    });
    const leaderIds = this.uniqueIds(dto.leaderIds);
    const userIds = [...leaderIds, ...(dto.memberIds ?? [])];
    await this.assertWorkspaceMembers(actor, userIds);
    return this.projects.create({
      workspaceId: new Types.ObjectId(actor.workspaceId),
      name: dto.name,
      serviceType: dto.serviceType,
      leaderIds: this.uniqueObjectIds(leaderIds),
      memberIds: this.uniqueObjectIds(
        (dto.memberIds ?? []).filter((id) => !leaderIds.includes(id)),
      ),
    });
  }

  async list(actor: Actor) {
    this.policy.assertCan(actor, Action.ProjectsRead, {
      workspaceId: actor.workspaceId,
    });
    return this.projects
      .find({
        workspaceId: new Types.ObjectId(actor.workspaceId),
        archived: false,
      })
      .sort({ name: 1 })
      .lean()
      .exec();
  }

  async get(actor: Actor, projectId: string) {
    const project = await this.findActive(actor, projectId);
    this.policy.assertCan(actor, Action.ProjectsRead, this.resource(project));
    return project;
  }

  async update(actor: Actor, projectId: string, dto: UpdateProjectDto) {
    const project = await this.findActive(actor, projectId);
    this.policy.assertCan(actor, Action.ProjectsUpdate, this.resource(project));
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(ErrorCode.ValidationFailed);
    }
    const leaderIds = dto.leaderIds
      ? this.uniqueIds(dto.leaderIds)
      : undefined;
    if (leaderIds) {
      await this.assertWorkspaceMembers(actor, leaderIds);
    }

    const update: Record<string, unknown> = {
      ...dto,
      ...(leaderIds
        ? {
            leaderIds: this.uniqueObjectIds(leaderIds),
            memberIds: project.memberIds.filter(
              (id) => !leaderIds.includes(id.toString()),
            ),
          }
        : {}),
    };
    const updated = await this.projects
      .findOneAndUpdate(
        {
          _id: project._id,
          workspaceId: new Types.ObjectId(actor.workspaceId),
          archived: false,
        },
        { $set: update },
        { new: true, runValidators: true },
      )
      .exec();
    if (!updated) throw new NotFoundException(ErrorCode.NotFound);
    return updated;
  }

  async archive(actor: Actor, projectId: string) {
    const project = await this.findActive(actor, projectId);
    this.policy.assertCan(actor, Action.ProjectsArchive, this.resource(project));
    const archived = await this.projects
      .findOneAndUpdate(
        {
          _id: project._id,
          workspaceId: new Types.ObjectId(actor.workspaceId),
          archived: false,
        },
        { $set: { archived: true } },
        { new: true },
      )
      .exec();
    if (!archived) throw new NotFoundException(ErrorCode.NotFound);
    return archived;
  }

  async restore(actor: Actor, projectId: string) {
    this.policy.assertCan(actor, Action.ProjectsRestore, {
      workspaceId: actor.workspaceId,
    });
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException(ErrorCode.NotFound);
    }
    const restored = await this.projects
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(projectId),
          workspaceId: new Types.ObjectId(actor.workspaceId),
          archived: true,
        },
        { $set: { archived: false } },
        { new: true },
      )
      .exec();
    if (!restored) throw new NotFoundException(ErrorCode.NotFound);
    return restored;
  }

  async addMembers(
    actor: Actor,
    projectId: string,
    dto: AddProjectMembersDto,
  ) {
    const project = await this.findActive(actor, projectId);
    this.policy.assertCan(
      actor,
      Action.ProjectsManageMembers,
      this.resource(project),
    );
    await this.assertWorkspaceMembers(actor, dto.memberIds);
    const leaders = new Set(project.leaderIds.map((id) => id.toString()));
    if (dto.memberIds.some((id) => leaders.has(id))) {
      throw new BadRequestException(ErrorCode.ValidationFailed);
    }
    const memberIds = this.uniqueObjectIds(dto.memberIds);
    const updated = await this.projects
      .findOneAndUpdate(
        {
          _id: project._id,
          workspaceId: new Types.ObjectId(actor.workspaceId),
          archived: false,
        },
        { $addToSet: { memberIds: { $each: memberIds } } },
        { new: true, runValidators: true },
      )
      .exec();
    if (!updated) throw new NotFoundException(ErrorCode.NotFound);
    return updated;
  }

  async findActive(actor: Actor, projectId: string): Promise<ProjectDocument> {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException(ErrorCode.NotFound);
    }
    const project = await this.projects
      .findOne({
        _id: new Types.ObjectId(projectId),
        workspaceId: new Types.ObjectId(actor.workspaceId),
        archived: false,
      })
      .exec();
    if (!project) throw new NotFoundException(ErrorCode.NotFound);
    return project;
  }

  resource(project: ProjectDocument) {
    return {
      workspaceId: project.workspaceId.toString(),
      projectLeaderIds: project.leaderIds.map((id) => id.toString()),
    };
  }

  private async assertWorkspaceMembers(actor: Actor, userIds: string[]) {
    const uniqueIds = [...new Set(userIds)];
    if (!uniqueIds.length) return;
    const count = await this.members.countDocuments({
      workspaceId: new Types.ObjectId(actor.workspaceId),
      userId: { $in: uniqueIds.map((id) => new Types.ObjectId(id)) },
      active: true,
      role: WorkspaceRole.Staff,
    });
    if (count !== uniqueIds.length) {
      throw new BadRequestException(ErrorCode.ValidationFailed);
    }
  }

  private uniqueObjectIds(ids: string[]) {
    return [...new Set(ids)].map((id) => new Types.ObjectId(id));
  }

  private uniqueIds(ids: string[]) {
    return [...new Set(ids)];
  }
}
