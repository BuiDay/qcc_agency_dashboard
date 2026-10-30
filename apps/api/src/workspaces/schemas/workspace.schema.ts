import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WorkspaceDocument = HydratedDocument<Workspace>;

export interface WorkspaceModules {
  clientPortal: boolean;
  timeTracking: boolean;
}

@Schema({ timestamps: true, versionKey: false })
export class Workspace {
  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({
    type: {
      clientPortal: { type: Boolean, default: false },
      timeTracking: { type: Boolean, default: false },
    },
    default: () => ({}),
  })
  modules!: WorkspaceModules;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
