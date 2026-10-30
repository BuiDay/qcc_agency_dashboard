import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true, versionKey: false })
export class Project {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Workspace', index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 160 })
  name!: string;

  @Prop({ type: String, trim: true, maxlength: 100 })
  serviceType?: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  leaderIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  memberIds!: Types.ObjectId[];

  @Prop({ type: Boolean, default: false, index: true })
  archived!: boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
ProjectSchema.index({ workspaceId: 1, archived: 1, name: 1 });
ProjectSchema.index({ workspaceId: 1, leaderIds: 1, archived: 1 });
