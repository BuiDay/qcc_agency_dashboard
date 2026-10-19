import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import {
  AcceptanceStatus,
  ApprovalStatus,
  ReviewResult,
  ReviewSource,
  StatusType,
} from '@qcc/shared';

// Mục checklist, nhúng trong task. Mỗi mục có thể giao cho 1 người với hạn riêng.
@Schema({ timestamps: false })
export class ChecklistItem {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  text: string;

  @Prop({ default: false })
  done: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Member' })
  assigneeId?: Types.ObjectId;

  @Prop()
  dueDate?: Date;
}
export const ChecklistItemSchema = SchemaFactory.createForClass(ChecklistItem);

@Schema({ _id: false })
export class Acceptance {
  @Prop({ type: String, enum: AcceptanceStatus, default: AcceptanceStatus.Pending })
  status: AcceptanceStatus;

  @Prop()
  at?: Date;

  // Lý do khi báo bận
  @Prop()
  reason?: string;
}

// Lịch sử duyệt: cả nội bộ và khách, dùng cho báo cáo "số lần sửa theo khách"
@Schema({ _id: false })
export class ReviewEntry {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Member', required: true })
  by: Types.ObjectId;

  @Prop({ type: String, enum: ReviewResult, required: true })
  result: ReviewResult;

  @Prop({ default: '' })
  note: string;

  @Prop({ type: String, enum: ReviewSource, required: true })
  source: ReviewSource;

  @Prop({ required: true })
  at: Date;
}

@Schema({ timestamps: true })
export class Task {
  // workspaceId + clientId có mặt ở mọi task để lọc quyền và làm báo cáo
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'List', required: true })
  listId: Types.ObjectId;

  // Sao chép từ cột để truy vấn/báo cáo không cần join
  @Prop({ type: String, enum: StatusType, required: true })
  statusType: StatusType;

  @Prop({ required: true })
  position: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  // Người chịu trách nhiệm chính
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Member' })
  ownerId?: Types.ObjectId;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Member', default: [] })
  collaboratorIds: Types.ObjectId[];

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Label', default: [] })
  labelIds: Types.ObjectId[];

  @Prop() startDate?: Date;
  @Prop() dueDate?: Date;
  @Prop({ type: Date, default: null }) completedAt?: Date | null;

  @Prop({ type: [ChecklistItemSchema], default: [] })
  checklist: Types.DocumentArray<ChecklistItem>;

  @Prop({ type: Acceptance, default: () => ({}) })
  acceptance: Acceptance;

  @Prop({ type: String, enum: ApprovalStatus, default: ApprovalStatus.None })
  approvalStatus: ApprovalStatus;

  @Prop({ type: [ReviewEntry], default: [] })
  reviewHistory: ReviewEntry[];

  // Giai đoạn sau: khách chỉ thấy task có clientVisible = true
  @Prop({ default: false })
  clientVisible: boolean;

  @Prop({ default: 0 })
  revisionCount: number;

  // Thời điểm vào cột hiện tại → "đã chờ khách X ngày"
  @Prop({ required: true })
  statusChangedAt: Date;

  @Prop({ default: false })
  archived: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Member', required: true })
  createdBy: Types.ObjectId;
}

export type TaskDocument = HydratedDocument<Task>;
export const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.index({ projectId: 1, listId: 1, position: 1 });
TaskSchema.index({ workspaceId: 1, ownerId: 1, statusType: 1 });
TaskSchema.index({ workspaceId: 1, dueDate: 1 });
TaskSchema.index({ workspaceId: 1, 'checklist.assigneeId': 1 });
