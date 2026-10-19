import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityType } from '@qcc/shared';
import type { Actor } from '../common/actor';
import { Activity } from './activity.schema';

export interface LogInput {
  type: ActivityType;
  clientId?: Types.ObjectId;
  projectId?: Types.ObjectId;
  taskId?: Types.ObjectId;
  data?: Record<string, unknown>;
}

/** Tên event phát ra sau mỗi lần ghi log (NotificationService sẽ lắng nghe ở MVP 1b) */
export const ACTIVITY_CREATED = 'activity.created';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name) private readonly activities: Model<Activity>,
    private readonly events: EventEmitter2,
  ) {}

  // Mọi thay đổi dữ liệu nghiệp vụ đều gọi hàm này
  async log(actor: Actor, input: LogInput) {
    const activity = await this.activities.create({
      workspaceId: new Types.ObjectId(actor.workspaceId),
      actorId: new Types.ObjectId(actor.memberId),
      data: {},
      ...input,
    });
    this.events.emit(ACTIVITY_CREATED, activity);
    return activity;
  }

  listForTask(actor: Actor, taskId: Types.ObjectId, limit = 100) {
    return this.activities
      .find({ workspaceId: actor.workspaceId, taskId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  listForProject(actor: Actor, projectId: Types.ObjectId, limit = 100) {
    return this.activities
      .find({ workspaceId: actor.workspaceId, projectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}
