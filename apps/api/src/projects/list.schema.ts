import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { StatusType } from '@qcc/shared';

// Cột trên bảng Kanban. Tên đổi được, statusType cố định.
@Schema({ timestamps: true })
export class List {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, enum: StatusType, required: true })
  statusType: StatusType;

  @Prop({ required: true })
  position: string;
}

export type ListDocument = HydratedDocument<List>;
export const ListSchema = SchemaFactory.createForClass(List);
ListSchema.index({ projectId: 1, position: 1 });
