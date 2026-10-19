import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { ActivityType } from '@qcc/shared';

// Nhật ký hoạt động: nguồn dữ liệu chung cho lịch sử task, thông báo, báo cáo, automation
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Activity {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Client' })
  clientId?: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Task' })
  taskId?: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Member', required: true })
  actorId: Types.ObjectId;

  @Prop({ type: String, enum: ActivityType, required: true })
  type: ActivityType;

  // Chi tiết thay đổi, VD: { from: 'production', to: 'internal_review' }
  @Prop({ type: Object, default: {} })
  data: Record<string, unknown>;

  createdAt: Date;
}

export type ActivityDocument = HydratedDocument<Activity>;
export const ActivitySchema = SchemaFactory.createForClass(Activity);
ActivitySchema.index({ taskId: 1, createdAt: -1 });
ActivitySchema.index({ projectId: 1, createdAt: -1 });
