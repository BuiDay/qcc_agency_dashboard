import {
  AcceptanceStatus,
  TaskApprovalStatus,
  TaskReviewResult,
  TaskStatusType,
} from '@qcc/shared';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

@Schema({ _id: false })
export class TaskAcceptance {
  @Prop({
    type: String,
    enum: Object.values(AcceptanceStatus),
    default: AcceptanceStatus.Pending,
  })
  status!: AcceptanceStatus;

  @Prop()
  at?: Date;

  @Prop()
  reason?: string;
}

@Schema({ _id: false })
export class TaskReview {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  by!: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(TaskReviewResult), required: true })
  result!: TaskReviewResult;

  @Prop({ default: '' })
  note!: string;

  @Prop({ type: String, enum: ['internal', 'client'], required: true })
  source!: 'internal' | 'client';

  @Prop({ type: Date, required: true })
  at!: Date;
}

@Schema({ timestamps: true, versionKey: false })
export class Task {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Workspace', index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client', index: true })
  clientId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Project', index: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'List' })
  listId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  position!: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 200 })
  title!: string;

  @Prop({ type: String, default: '' })
  description!: string;

  @Prop({
    type: String,
    enum: Object.values(TaskStatusType),
    default: TaskStatusType.Brief,
    index: true,
  })
  statusType!: TaskStatusType;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User', index: true })
  ownerId!: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  collaboratorIds!: Types.ObjectId[];

  @Prop({ type: Date, index: true })
  dueDate?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({
    type: TaskAcceptance,
    default: () => ({ status: AcceptanceStatus.Pending }),
  })
  acceptance!: TaskAcceptance;

  @Prop({
    type: String,
    enum: Object.values(TaskApprovalStatus),
    default: TaskApprovalStatus.Pending,
  })
  approvalStatus!: TaskApprovalStatus;

  @Prop({ type: String, default: '' })
  submissionNote!: string;

  @Prop({ type: [TaskReview], default: [] })
  reviewHistory!: TaskReview[];

  @Prop({ type: Number, default: 0 })
  revisionCount!: number;

  @Prop({ type: Date, default: Date.now })
  statusChangedAt!: Date;

  @Prop({ type: Boolean, default: false })
  archived!: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.index({ workspaceId: 1, projectId: 1, statusType: 1, position: 1 });
TaskSchema.index({ workspaceId: 1, ownerId: 1, statusType: 1 });
TaskSchema.index({ workspaceId: 1, dueDate: 1 });
