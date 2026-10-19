import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// Bật/tắt module mở rộng. Thêm module mới: thêm 1 field ở đây.
@Schema({ _id: false })
export class WorkspaceModules {
  @Prop({ default: false }) clientPortal: boolean;
  @Prop({ default: false }) timeTracking: boolean;
  @Prop({ default: false }) contracts: boolean;
  @Prop({ default: false }) automation: boolean;
  @Prop({ default: false }) ai: boolean;
}

@Schema({ _id: false })
export class WorkspaceSettings {
  // Task chờ khách quá số ngày này thì cảnh báo
  @Prop({ default: 3 }) clientReviewWarnDays: number;
  @Prop({ default: 'Asia/Ho_Chi_Minh' }) timezone: string;
}

// Workspace = agency. Mọi dữ liệu khác đều có workspaceId.
@Schema({ timestamps: true })
export class Workspace {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  logo?: string;

  @Prop({ type: WorkspaceModules, default: () => ({}) })
  modules: WorkspaceModules;

  @Prop({ type: WorkspaceSettings, default: () => ({}) })
  settings: WorkspaceSettings;
}

export type WorkspaceDocument = HydratedDocument<Workspace>;
export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
