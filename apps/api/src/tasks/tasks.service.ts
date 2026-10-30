import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AcceptanceStatus,
  Action,
  ErrorCode,
  TaskApprovalStatus,
  TaskReviewResult,
  TaskStatusType,
  WorkspaceRole,
} from '@qcc/shared';
import { generateKeyBetween } from 'fractional-indexing';
import {
  FilterQuery,
  Model,
  Types,
  UpdateQuery,
} from 'mongoose';
import { Actor } from '../common/interfaces/actor.interface';
import { PolicyService } from '../common/policy/policy.service';
import { Member } from '../members/schemas/member.schema';
import { ProjectDocument } from '../projects/schemas/project.schema';
import { ProjectsService } from '../projects/projects.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { ReviewTaskDto } from './dto/task-action.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Activity } from './schemas/activity.schema';
import {
  Task,
  TaskDocument,
  TaskReview,
} from './schemas/task.schema';
import { TaskWorkflowService } from './task-workflow.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly tasks: Model<Task>,
    @InjectModel(Activity.name) private readonly activities: Model<Activity>,
    @InjectModel(Member.name) private readonly members: Model<Member>,
    private readonly policy: PolicyService,
    private readonly workflow: TaskWorkflowService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(actor: Actor, dto: CreateTaskDto) {
    const project = await this.projectsService.findActive(actor, dto.projectId);
    this.policy.assertCan(
      actor,
      Action.TasksCreate,
      this.projectsService.resource(project),
    );
    await this.assertWorkspaceUsers(actor, [
      dto.ownerId,
      ...(dto.collaboratorIds ?? []),
    ]);
    this.assertProjectUsers(project, [
      dto.ownerId,
      ...(dto.collaboratorIds ?? []),
    ]);

    const projectId = new Types.ObjectId(dto.projectId);
    const position = await this.nextPosition(
      actor.workspaceId,
      projectId,
      TaskStatusType.Brief,
    );
    const task = await this.tasks.create({
      ...dto,
      workspaceId: actor.workspaceId,
      projectId,
      ownerId: new Types.ObjectId(dto.ownerId),
      collaboratorIds: (dto.collaboratorIds ?? []).map(
        (id) => new Types.ObjectId(id),
      ),
      ...(dto.clientId ? { clientId: new Types.ObjectId(dto.clientId) } : {}),
      position,
      statusType: TaskStatusType.Brief,
      acceptance: { status: AcceptanceStatus.Pending },
      approvalStatus: TaskApprovalStatus.Pending,
      statusChangedAt: new Date(),
    });
    await this.log(actor, task, 'task.created', {
      title: task.title,
      ownerId: task.ownerId.toString(),
    });
    return task;
  }

  async list(actor: Actor, query: ListTasksQueryDto) {
    const project = await this.projectsService.findActive(actor, query.projectId);
    this.policy.assertCan(
      actor,
      Action.TasksRead,
      this.projectsService.resource(project),
    );
    if (
      query.dueFrom &&
      query.dueTo &&
      query.dueFrom.getTime() > query.dueTo.getTime()
    ) {
      throw new BadRequestException(ErrorCode.ValidationFailed);
    }

    const filter: FilterQuery<Task> = {
      workspaceId: new Types.ObjectId(actor.workspaceId),
      projectId: new Types.ObjectId(query.projectId),
      archived: false,
    };
    if (query.ownerId) filter.ownerId = new Types.ObjectId(query.ownerId);
    if (query.statusType) filter.statusType = query.statusType;
    if (query.dueFrom || query.dueTo) {
      filter.dueDate = {
        ...(query.dueFrom ? { $gte: query.dueFrom } : {}),
        ...(query.dueTo ? { $lte: query.dueTo } : {}),
      };
    }
    return this.tasks.find(filter).sort({ position: 1, _id: 1 }).lean().exec();
  }

  async get(actor: Actor, taskId: string) {
    const task = await this.findTask(actor, taskId);
    const project = await this.projectForTask(actor, task);
    this.policy.assertCan(
      actor,
      Action.TasksRead,
      this.projectsService.resource(project),
    );
    return task;
  }

  async update(actor: Actor, taskId: string, dto: UpdateTaskDto) {
    const task = await this.findTask(actor, taskId);
    const project = await this.projectForTask(actor, task);
    this.policy.assertCan(
      actor,
      Action.TasksUpdate,
      this.resource(task, project),
    );
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(ErrorCode.ValidationFailed);
    }
    const userIds = [
      ...(dto.ownerId ? [dto.ownerId] : []),
      ...(dto.collaboratorIds ?? []),
    ];
    if (userIds.length) {
      await this.assertWorkspaceUsers(actor, userIds);
      this.assertProjectUsers(project, userIds);
    }

    const changes: Record<string, unknown> = { ...dto };
    if (dto.clientId) changes.clientId = new Types.ObjectId(dto.clientId);
    if (dto.ownerId) {
      const nextOwnerId = new Types.ObjectId(dto.ownerId);
      if (!nextOwnerId.equals(task.ownerId)) {
        changes.ownerId = nextOwnerId;
        changes.acceptance = { status: AcceptanceStatus.Pending };
      }
    }
    if (dto.collaboratorIds) {
      changes.collaboratorIds = dto.collaboratorIds.map(
        (id) => new Types.ObjectId(id),
      );
    }

    const updated = await this.tasks
      .findOneAndUpdate(
        { _id: task._id, workspaceId: actor.workspaceId, archived: false },
        { $set: changes },
        { new: true, runValidators: true },
      )
      .exec();
    if (!updated) throw new NotFoundException(ErrorCode.NotFound);
    const changedFields = Object.keys(dto);
    if (changes.acceptance) changedFields.push('acceptance');
    await this.log(actor, updated, 'task.updated', {
      fields: changedFields,
      before: Object.fromEntries(
        changedFields.map((field) => [field, task.get(field)]),
      ),
      after: Object.fromEntries(
        changedFields.map((field) => [field, updated.get(field)]),
      ),
    });
    return updated;
  }

  async archive(actor: Actor, taskId: string) {
    const task = await this.findTask(actor, taskId);
    const project = await this.projectForTask(actor, task);
    this.policy.assertCan(
      actor,
      Action.TasksArchive,
      this.resource(task, project),
    );
    const updated = await this.tasks
      .findOneAndUpdate(
        { _id: task._id, workspaceId: actor.workspaceId, archived: false },
        { $set: { archived: true } },
        { new: true },
      )
      .exec();
    if (!updated) throw new NotFoundException(ErrorCode.NotFound);
    await this.log(actor, updated, 'task.archived', {});
    return updated;
  }

  async accept(actor: Actor, taskId: string) {
    return this.applyWorkflowAction(
      actor,
      taskId,
      Action.TasksAccept,
      (task) => this.workflow.accept(task),
      'task.accepted',
    );
  }

  async decline(actor: Actor, taskId: string, reason: string) {
    return this.applyWorkflowAction(
      actor,
      taskId,
      Action.TasksDecline,
      (task) => this.workflow.decline(task, reason),
      'task.declined',
      { reason },
    );
  }

  async submit(actor: Actor, taskId: string, note = '') {
    return this.applyWorkflowAction(
      actor,
      taskId,
      Action.TasksSubmit,
      (task) => this.workflow.submit(task, note),
      'task.submitted',
      { note },
    );
  }

  async review(actor: Actor, taskId: string, dto: ReviewTaskDto) {
    return this.applyWorkflowAction(
      actor,
      taskId,
      Action.TasksReview,
      (task) =>
        this.workflow.review(task, actor.userId, dto.result, dto.note),
      'task.reviewed',
      { result: dto.result, note: dto.note ?? '' },
    );
  }

  async clientReview(actor: Actor, taskId: string, dto: ReviewTaskDto) {
    return this.applyWorkflowAction(
      actor,
      taskId,
      Action.TasksClientReview,
      (task) =>
        this.workflow.clientReview(task, actor.userId, dto.result, dto.note),
      'task.client_reviewed',
      { result: dto.result, note: dto.note ?? '' },
    );
  }

  async move(actor: Actor, taskId: string, dto: MoveTaskDto) {
    const task = await this.findTask(actor, taskId);
    const project = await this.projectForTask(actor, task);
    const isProjectLeader = project.leaderIds.some(
      (leaderId) => leaderId.toString() === actor.userId,
    );
    if (
      actor.role === WorkspaceRole.Staff &&
      !isProjectLeader &&
      [TaskStatusType.ClientReview, TaskStatusType.Scheduled, TaskStatusType.Done]
        .includes(dto.statusType)
    ) {
      throw new ForbiddenException(ErrorCode.TaskColumnLocked);
    }
    this.policy.assertCan(actor, Action.TasksMove, {
      ...this.resource(task, project),
      statusType: dto.statusType,
    });

    const position = await this.positionForMove(actor, task, dto);
    const statusChanged = task.statusType !== dto.statusType;
    const now = new Date();
    const update: UpdateQuery<Task> = {
      $set: {
        statusType: dto.statusType,
        position,
        ...(statusChanged ? { statusChangedAt: now } : {}),
        ...(dto.statusType === TaskStatusType.Done
          ? { completedAt: now }
          : {}),
      },
      ...(dto.statusType !== TaskStatusType.Done ? { $unset: { completedAt: 1 } } : {}),
    };
    const updated = await this.tasks
      .findOneAndUpdate(
        { _id: task._id, workspaceId: actor.workspaceId, archived: false },
        update,
        { new: true, runValidators: true },
      )
      .exec();
    if (!updated) throw new NotFoundException(ErrorCode.NotFound);
    await this.log(actor, updated, 'task.moved', {
      fromStatusType: task.statusType,
      toStatusType: dto.statusType,
      fromPosition: task.position,
      toPosition: position,
      fromCompletedAt: task.completedAt,
      toCompletedAt: updated.completedAt,
    });
    return updated;
  }

  private async applyWorkflowAction(
    actor: Actor,
    taskId: string,
    action: Action,
    transition: (task: TaskDocument) => ReturnType<TaskWorkflowService['accept']>,
    activityType: string,
    activityData: Record<string, unknown> = {},
  ) {
    const task = await this.findTask(actor, taskId);
    const project = await this.projectForTask(actor, task);
    this.policy.assertCan(
      actor,
      action,
      this.resource(task, project),
    );
    const changes = transition(task);
    const { reviewHistory, ...setChanges } = changes;
    const update: UpdateQuery<Task> = { $set: setChanges };
    if (reviewHistory?.length) {
      const entry = reviewHistory[0];
      const review: TaskReview = {
        ...entry,
        by: new Types.ObjectId(entry.by),
      };
      update.$push = { reviewHistory: { $each: [review] } };
    }
    const updated = await this.tasks
      .findOneAndUpdate(
        { _id: task._id, workspaceId: actor.workspaceId, archived: false },
        update,
        { new: true, runValidators: true },
      )
      .exec();
    if (!updated) throw new NotFoundException(ErrorCode.NotFound);
    await this.log(actor, updated, activityType, activityData);
    return updated;
  }

  private async findTask(actor: Actor, taskId: string): Promise<TaskDocument> {
    if (!Types.ObjectId.isValid(taskId)) {
      throw new NotFoundException(ErrorCode.NotFound);
    }
    const task = await this.tasks
      .findOne({
        _id: new Types.ObjectId(taskId),
        workspaceId: actor.workspaceId,
        archived: false,
      })
      .exec();
    if (!task) throw new NotFoundException(ErrorCode.NotFound);
    return task;
  }

  private resource(task: TaskDocument, project: ProjectDocument) {
    return {
      workspaceId: task.workspaceId.toString(),
      ownerId: task.ownerId.toString(),
      projectLeaderIds: project.leaderIds.map((id) => id.toString()),
    };
  }

  private async projectForTask(actor: Actor, task: TaskDocument) {
    return this.projectsService.findActive(actor, task.projectId.toString());
  }

  private assertProjectUsers(project: ProjectDocument, userIds: string[]) {
    const projectUserIds = new Set([
      ...project.leaderIds.map((id) => id.toString()),
      ...project.memberIds.map((id) => id.toString()),
    ]);
    if (userIds.some((id) => !projectUserIds.has(id))) {
      throw new BadRequestException(ErrorCode.ValidationFailed);
    }
  }

  private async assertWorkspaceUsers(actor: Actor, userIds: string[]) {
    const uniqueIds = [...new Set(userIds)];
    const count = await this.members.countDocuments({
      workspaceId: actor.workspaceId,
      userId: { $in: uniqueIds.map((id) => new Types.ObjectId(id)) },
      active: true,
      role: WorkspaceRole.Staff,
    });
    if (count !== uniqueIds.length) {
      throw new BadRequestException(ErrorCode.ValidationFailed);
    }
  }

  private async nextPosition(
    workspaceId: string,
    projectId: Types.ObjectId,
    statusType: TaskStatusType,
  ): Promise<string> {
    const last = await this.tasks
      .findOne({
        workspaceId,
        projectId,
        statusType,
        archived: false,
      })
      .sort({ position: -1 })
      .select('position')
      .lean()
      .exec();
    return generateKeyBetween(last?.position ?? null, null);
  }

  private async positionForMove(
    actor: Actor,
    task: TaskDocument,
    dto: MoveTaskDto,
  ): Promise<string> {
    if (
      dto.afterTaskId &&
      dto.afterTaskId === dto.beforeTaskId
    ) {
      throw new BadRequestException(ErrorCode.ValidationFailed);
    }
    const filter: FilterQuery<Task> = {
      workspaceId: actor.workspaceId,
      projectId: task.projectId,
      statusType: dto.statusType,
      archived: false,
      _id: { $ne: task._id },
    };
    const findNeighbor = async (id: string) => {
      const neighbor = await this.tasks
        .findOne({ ...filter, _id: new Types.ObjectId(id) })
        .select('position')
        .lean()
        .exec();
      if (!neighbor) throw new NotFoundException(ErrorCode.NotFound);
      return neighbor;
    };

    let after = dto.afterTaskId
      ? await findNeighbor(dto.afterTaskId)
      : undefined;
    let before = dto.beforeTaskId
      ? await findNeighbor(dto.beforeTaskId)
      : undefined;

    if (after && before && after.position >= before.position) {
      throw new BadRequestException(ErrorCode.InvalidTaskTransition);
    }
    if (!after && !before) {
      const last = await this.tasks
        .findOne(filter)
        .sort({ position: -1 })
        .select('position')
        .lean()
        .exec();
      after = last ?? undefined;
    } else if (after && !before) {
      before =
        (await this.tasks
          .findOne({ ...filter, position: { $gt: after.position } })
          .sort({ position: 1 })
          .select('position')
          .lean()
          .exec()) ?? undefined;
    } else if (!after && before) {
      after =
        (await this.tasks
          .findOne({ ...filter, position: { $lt: before.position } })
          .sort({ position: -1 })
          .select('position')
          .lean()
          .exec()) ?? undefined;
    }
    return generateKeyBetween(
      after?.position ?? null,
      before?.position ?? null,
    );
  }

  private async log(
    actor: Actor,
    task: TaskDocument,
    type: string,
    data: Record<string, unknown>,
  ) {
    await this.activities.create({
      workspaceId: task.workspaceId,
      ...(task.clientId ? { clientId: task.clientId } : {}),
      projectId: task.projectId,
      taskId: task._id,
      actorId: new Types.ObjectId(actor.userId),
      type,
      data,
    });
  }
}
