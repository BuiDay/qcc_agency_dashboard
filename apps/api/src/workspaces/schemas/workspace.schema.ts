import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WorkspaceDocument = HydratedDocument<Workspace>;

@Schema({ _id: false })
export class WorkspaceModules {
  @Prop({ default: false })
  clientPortal!: boolean;

  @Prop({ default: false })
  timeTracking!: boolean;
}

@Schema({ timestamps: true, versionKey: false })
export class Workspace {
  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ type: WorkspaceModules, default: () => ({}) })
  modules!: WorkspaceModules;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
