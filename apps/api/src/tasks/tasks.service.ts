import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Action,
  ActivityType,
  ErrorCode,
  ReviewSource,
  StatusType,
  SUBMITTABLE_STATUSES,
  WorkspaceRole,
} from '@qcc/shared';
import { ActivitiesService } from '../activities/activities.service';
import type { Actor } from '../common/actor';
import { AppException, notFound } from '../common/app-exception';
import { hasId, toObjectId } from '../common/object-id';
import { positionBetween } from '../common/position';
import { PolicyContext } from '../permissions/policy';
import { PolicyService } from '../permissions/policy.service';
import { ProjectDocument } from '../projects/project.schema';
import { ProjectsService } from '../projects/projects.service';
import {
  AssignTaskDto,
  CreateTaskDto,
  DeclineTaskDto,
  ListTasksQuery,
  MoveTaskDto,
  NewChecklistItemDto,
  ReviewTaskDto,
  UpdateChecklistItemDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { Task, TaskDocument } from './task.schema';
import * as wf from './task-workflow';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly tasks: Model<Task>,
    private readonly projects: ProjectsService,
    private readonly policy: PolicyService,
    private readonly activities: ActivitiesService,
  ) {}

  // ===================== Đọc =====================

  async listByProject(actor: Actor, projectId: string, q: ListTasksQuery) {
    const project = await this.projects.findOrFail(actor, projectId);
    this.policy.assert(actor, Action.TaskView, { project });
    const filter: Record<string, unknown> = { workspaceId: actor.workspaceId, projectId: project._id };
    if (q.includeArchived !== 'true') filter.archived = false;
    if (q.ownerId) filter.ownerId = q.ownerId;
    if (q.listId) filter.listId = q.listId;
    if (q.statusType) filter.statusType = q.statusType;
    if (q.dueBefore) filter.dueDate = { $lte: new Date(q.dueBefore) };
    return this.tasks.find(filter).sort({ listId: 1, position: 1, _id: 1 }).lean();
  }

  /** "Việc của tôi": task tôi phụ trách, phối hợp, hoặc có mục checklist giao cho tôi; chưa hoàn thành */
  myTasks(actor: Actor) {
    const me = new Types.ObjectId(actor.memberId);
    return this.tasks
      .find({
        workspaceId: actor.workspaceId,
        archived: false,
        statusType: { $ne: StatusType.Done },
        $or: [{ ownerId: me }, { collaboratorIds: me }, { 'checklist.assigneeId': me }],
      })
      .populate('projectId', 'name')
      .populate('clientId', 'name')
      .sort({ dueDate: 1, createdAt: 1 })
      .lean();
  }

  async get(actor: Actor, id: string) {
    const { task, project } = await this.load(actor, id);
    this.policy.assert(actor, Action.TaskView, this.ctx(project, task));
    return task.toObject();
  }

  async activitiesOf(actor: Actor, id: string) {
    const { task, project } = await this.load(actor, id);
    this.policy.assert(actor, Action.TaskView, this.ctx(project, task));
    return this.activities.listForTask(actor, task._id);
  }

  // ===================== Tạo / sửa =====================

  async create(actor: Actor, projectId: string, dto: CreateTaskDto) {
    const project = await this.projects.findOrFail(actor, projectId);
    this.policy.assert(actor, Action.TaskCreate, { project });
    this.projects.assertActive(project);

    const list = dto.listId
      ? await this.projects.findListOrFail(project, dto.listId)
      : await this.projects.findListByStatus(project, StatusType.Brief);

    const people = [dto.ownerId, ...(dto.collaboratorIds ?? []), ...(dto.checklist ?? []).map((c) => c.assigneeId)];
    this.assertInProject(project, people);

    const now = new Date();
    const task = await this.tasks.create({
      workspaceId: project.workspaceId,
      clientId: project.clientId,
      projectId: project._id,
      listId: list._id,
      statusType: list.statusType,
      position: await this.endPosition(list._id),
      title: dto.title,
      description: dto.description ?? '',
      ownerId: dto.ownerId,
      collaboratorIds: dto.collaboratorIds ?? [],
      labelIds: dto.labelIds ?? [],
      startDate: dto.startDate,
      dueDate: dto.dueDate,
      checklist: (dto.checklist ?? []).map((c) => ({ text: c.text, assigneeId: c.assigneeId, dueDate: c.dueDate })),
      clientVisible: dto.clientVisible ?? false,
      statusChangedAt: now,
      completedAt: list.statusType === StatusType.Done ? now : null,
      createdBy: new Types.ObjectId(actor.memberId),
    });

    await this.log(actor, task, ActivityType.TaskCreated, { title: task.title, statusType: task.statusType });
    if (task.ownerId) await this.log(actor, task, ActivityType.TaskAssigned, { ownerId: task.ownerId });
    return task.toObject();
  }

  async update(actor: Actor, id: string, dto: UpdateTaskDto) {
    const { task, project } = await this.load(actor, id);
    this.policy.assert(actor, Action.TaskUpdate, this.ctx(project, task));
    this.assertEditable(task, project);
    task.set(dto);
    await task.save();
    await this.log(actor, task, ActivityType.TaskUpdated, { fields: Object.keys(dto) });
    return task.toObject();
  }

  /** Giao / đổi người. Đổi owner → người mới phải tiếp nhận lại. */
  async assign(actor: Actor, id: string, dto: AssignTaskDto) {
    const { task, project } = await this.load(actor, id);
    this.policy.assert(actor, Action.TaskAssign, this.ctx(project, task));
    this.assertEditable(task, project);
    this.assertInProject(project, [dto.ownerId ?? undefined, ...(dto.collaboratorIds ?? [])]);

    const data: Record<string, unknown> = {};
    if (dto.ownerId !== undefined && dto.ownerId?.toString() !== task.ownerId?.toString()) {
      task.ownerId = dto.ownerId ? new Types.ObjectId(dto.ownerId) : undefined;
      task.set(wf.assign());
      data.ownerId = dto.ownerId;
    }
    if (dto.collaboratorIds) {
      task.collaboratorIds = dto.collaboratorIds.map((x) => new Types.ObjectId(x));
      data.collaboratorIds = dto.collaboratorIds;
    }
    await task.save();
    await this.log(actor, task, ActivityType.TaskAssigned, data);
    return task.toObject();
  }

  // ===================== Hành động theo quy trình =====================

  async accept(actor: Actor, id: string) {
    const { task, project } = await this.load(actor, id);
    this.policy.assert(actor, Action.TaskAccept, this.ctx(project, task));
    this.assertEditable(task, project);
    const patch = wf.accept(task, new Date());
    await this.applyPatch(task, project, patch);
    await this.log(actor, task, ActivityType.TaskAccepted, { statusType: task.statusType });
    return task.toObject();
  }

  async decline(actor: Actor, id: string, dto: DeclineTaskDto) {
    const { task, project } = await this.load(actor, id);
    this.policy.assert(actor, Action.TaskDecline, this.ctx(project, task));
    this.assertEditable(task, project);
    await this.applyPatch(task, project, wf.decline(task, dto.reason, new Date()));
    await this.log(actor, task, ActivityType.TaskDeclined, { reason: task.acceptance.reason });
    return task.toObject();
  }

  async submit(actor: Actor, id: string) {
    const { task, project } = await this.load(actor, id);
    this.policy.assert(actor, Action.TaskSubmit, this.ctx(project, task));
    this.assertEditable(task, project);
    const from = task.statusType;
    await this.applyPatch(task, project, wf.submit(task, new Date()));
    await this.log(actor, task, ActivityType.TaskSubmitted, { from, to: task.statusType });
    return task.toObject();
  }

  /** Leader duyệt nội bộ */
  async review(actor: Actor, id: string, dto: ReviewTaskDto) {
    return this.doReview(actor, id, dto, ReviewSource.Internal);
  }

  /** Leader ghi nhận kết quả khách duyệt (sau này: khách tự bấm trên portal) */
  async clientReview(actor: Actor, id: string, dto: ReviewTaskDto) {
    return this.doReview(actor, id, dto, ReviewSource.Client);
  }

  /** Kéo thả sang cột khác hoặc đổi thứ tự trong cột */
  async move(actor: Actor, id: string, dto: MoveTaskDto) {
    const { task, project } = await this.load(actor, id);
    this.assertEditable(task, project);
    const target = await this.projects.findListOrFail(project, dto.listId);
    this.policy.assert(actor, Action.TaskMove, this.ctx(project, task, target.statusType));

    const now = new Date();
    const from = { listId: task.listId, statusType: task.statusType };
    const isLeader = actor.role === WorkspaceRole.Admin || hasId(project.leaderIds, actor.memberId);

    // Nhân viên kéo vào "Duyệt nội bộ" = nộp duyệt → áp đúng quy tắc nộp duyệt
    const patch =
      !isLeader && target.statusType === StatusType.InternalReview && SUBMITTABLE_STATUSES.includes(task.statusType)
        ? wf.submit(task, now)
        : wf.changeStatus(task, target.statusType, now);

    task.set(patch);
    task.listId = target._id;
    task.position = await this.positionFor(target._id, task._id, dto);
    await task.save();

    if (from.listId.toString() !== target._id.toString()) {
      await this.log(actor, task, ActivityType.TaskMoved, {
        from: from.statusType,
        to: task.statusType,
        fromListId: from.listId,
        toListId: target._id,
      });
    }
    return task.toObject();
  }

  // ===================== Checklist =====================

  async addChecklistItem(actor: Actor, id: string, dto: NewChecklistItemDto) {
    const { task, project } = await this.load(actor, id);
    this.policy.assert(actor, Action.TaskUpdate, this.ctx(project, task));
    this.assertEditable(task, project);
    this.assertInProject(project, [dto.assigneeId]);
    task.checklist.push({ text: dto.text, assigneeId: dto.assigneeId, dueDate: dto.dueDate });
    await task.save();
    await this.log(actor, task, ActivityType.TaskChecklistUpdated, { added: dto.text });
    return task.toObject();
  }

  /** Chỉ tick done: người làm cũng được. Sửa nội dung/người/hạn: chỉ leader. */
  async updateChecklistItem(actor: Actor, id: string, itemId: string, dto: UpdateChecklistItemDto) {
    const { task, project } = await this.load(actor, id);
    this.assertEditable(task, project);
    const item = task.checklist.id(itemId);
    if (!item) throw notFound(ErrorCode.ChecklistItemNotFound);

    const onlyToggle = Object.keys(dto).every((k) => k === 'done');
    const ctx = this.ctx(project, task);
    if (onlyToggle) {
      ctx.task!.checklistAssigneeIds = item.assigneeId ? [item.assigneeId] : [];
      this.policy.assert(actor, Action.TaskChecklist, ctx);
    } else {
      this.policy.assert(actor, Action.TaskUpdate, ctx);
      if (dto.assigneeId) this.assertInProject(project, [dto.assigneeId]);
    }

    item.set(dto);
    await task.save();
    await this.log(actor, task, ActivityType.TaskChecklistUpdated, { itemId, ...dto });
    return task.toObject();
  }

  async removeChecklistItem(actor: Actor, id: string, itemId: string) {
    const { task, project } = await this.load(actor, id);
    this.policy.assert(actor, Action.TaskUpdate, this.ctx(project, task));
    this.assertEditable(task, project);
    const item = task.checklist.id(itemId);
    if (!item) throw notFound(ErrorCode.ChecklistItemNotFound);
    item.deleteOne();
    await task.save();
    await this.log(actor, task, ActivityType.TaskChecklistUpdated, { removed: item.text });
    return task.toObject();
  }

  // ===================== Lưu trữ =====================

  async setArchived(actor: Actor, id: string, archived: boolean) {
    const { task, project } = await this.load(actor, id);
    this.policy.assert(actor, Action.TaskArchive, this.ctx(project, task));
    task.archived = archived;
    await task.save();
    await this.log(actor, task, ActivityType.TaskArchived, { archived });
    return task.toObject();
  }

  // ===================== Nội bộ =====================

  private async doReview(actor: Actor, id: string, dto: ReviewTaskDto, source: ReviewSource) {
    const { task, project } = await this.load(actor, id);
    const action = source === ReviewSource.Internal ? Action.TaskReview : Action.TaskClientReview;
    this.policy.assert(actor, action, this.ctx(project, task));
    this.assertEditable(task, project);
    const patch = wf.review(task, { ...dto, by: actor.memberId, source }, new Date());
    await this.applyPatch(task, project, patch);
    await this.log(
      actor,
      task,
      source === ReviewSource.Internal ? ActivityType.TaskReviewed : ActivityType.TaskClientReviewed,
      { result: dto.result, note: patch.review?.note, to: task.statusType },
    );
    return task.toObject();
  }

  /** Lưu kết quả workflow. Nếu đổi trạng thái → chuyển sang cột tương ứng, nằm cuối cột. */
  private async applyPatch(task: TaskDocument, project: ProjectDocument, patch: wf.TaskPatch) {
    const { review, ...fields } = patch;
    if (fields.statusType && fields.statusType !== task.statusType) {
      const list = await this.projects.findListByStatus(project, fields.statusType);
      task.listId = list._id;
      task.position = await this.endPosition(list._id);
    }
    task.set(fields);
    if (review) task.reviewHistory.push({ ...review, by: new Types.ObjectId(review.by) });
    await task.save();
  }

  private async load(actor: Actor, id: string) {
    const task = await this.tasks.findOne({ _id: toObjectId(id, ErrorCode.TaskNotFound), workspaceId: actor.workspaceId });
    if (!task) throw notFound(ErrorCode.TaskNotFound);
    const project = await this.projects.findOrFail(actor, task.projectId);
    return { task, project };
  }

  private ctx(project: ProjectDocument, task: TaskDocument, targetStatus?: StatusType): PolicyContext {
    return {
      project: { leaderIds: project.leaderIds, memberIds: project.memberIds },
      task: { ownerId: task.ownerId, collaboratorIds: task.collaboratorIds, statusType: task.statusType },
      targetStatus,
    };
  }

  private assertEditable(task: TaskDocument, project: ProjectDocument) {
    this.projects.assertActive(project);
    if (task.archived) throw new AppException(ErrorCode.TaskArchived);
  }

  /** Người được giao phải là leader hoặc thành viên của dự án */
  private assertInProject(project: ProjectDocument, ids: (string | undefined | null)[]) {
    for (const id of ids) {
      if (!id) continue;
      if (!hasId(project.leaderIds, id) && !hasId(project.memberIds, id)) {
        throw new AppException(ErrorCode.MemberNotInProject, HttpStatus.BAD_REQUEST);
      }
    }
  }

  private async endPosition(listId: Types.ObjectId, excludeId?: Types.ObjectId) {
    const last = await this.tasks
      .findOne({ listId, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
      .sort({ position: -1 })
      .select('position')
      .lean();
    return positionBetween(last?.position ?? null, null);
  }

  /** Tính vị trí mới khi kéo thả, dựa trên thẻ phía trên hoặc phía dưới */
  private async positionFor(listId: Types.ObjectId, selfId: Types.ObjectId, dto: MoveTaskDto): Promise<string> {
    const others = { listId, _id: { $ne: selfId } };
    const findIn = async (taskId: string) => {
      const t = await this.tasks.findOne({ ...others, _id: toObjectId(taskId, ErrorCode.TaskNotFound) }).select('position').lean();
      if (!t || t._id.equals(selfId)) throw notFound(ErrorCode.TaskNotFound);
      return t.position;
    };

    let prev: string | null = null;
    let next: string | null = null;
    if (dto.prevTaskId) {
      prev = await findIn(dto.prevTaskId);
      const n = await this.tasks.findOne({ ...others, position: { $gt: prev } }).sort({ position: 1 }).select('position').lean();
      next = n?.position ?? null;
    } else if (dto.nextTaskId) {
      next = await findIn(dto.nextTaskId);
      const p = await this.tasks.findOne({ ...others, position: { $lt: next } }).sort({ position: -1 }).select('position').lean();
      prev = p?.position ?? null;
    } else {
      return this.endPosition(listId, selfId);
    }
    // Phòng trường hợp 2 thẻ trùng vị trí do ghi đồng thời
    if (prev !== null && next !== null && prev >= next) return positionBetween(prev, null);
    return positionBetween(prev, next);
  }

  private log(actor: Actor, task: TaskDocument, type: ActivityType, data: Record<string, unknown>) {
    return this.activities.log(actor, {
      type,
      clientId: task.clientId,
      projectId: task.projectId,
      taskId: task._id,
      data,
    });
  }
}
