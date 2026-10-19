import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

// Dự án / chiến dịch của một khách hàng. Quyền leader gắn theo từng dự án.
@Schema({ timestamps: true })
export class Project {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  // Loại dịch vụ: social, ads, video, seo, branding... (dùng cho template sau này)
  @Prop({ default: 'social' })
  serviceType: string;

  // Admin gán
  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Member', default: [] })
  leaderIds: Types.ObjectId[];

  // Leader thêm
  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Member', default: [] })
  memberIds: Types.ObjectId[];

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ default: false })
  archived: boolean;
}

export type ProjectDocument = HydratedDocument<Project>;
export const ProjectSchema = SchemaFactory.createForClass(Project);
ProjectSchema.index({ workspaceId: 1, clientId: 1, archived: 1 });
