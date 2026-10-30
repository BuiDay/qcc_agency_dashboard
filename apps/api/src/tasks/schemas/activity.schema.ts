import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ActivityDocument = HydratedDocument<Activity>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, versionKey: false })
export class Activity {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Workspace', index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client', index: true })
  clientId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Project', index: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Task', index: true })
  taskId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User', index: true })
  actorId!: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  type!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  data!: Record<string, unknown>;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
ActivitySchema.index({ workspaceId: 1, taskId: 1, createdAt: -1 });
