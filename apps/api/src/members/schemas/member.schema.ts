import { WorkspaceRole } from '@qcc/shared';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MemberDocument = HydratedDocument<Member>;

@Schema({ timestamps: true, versionKey: false })
export class Member {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Workspace', index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User', index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(WorkspaceRole), required: true })
  role!: WorkspaceRole;

  @Prop({ type: [String], default: [] })
  skills!: string[];

  @Prop({ type: [Types.ObjectId], default: [] })
  clientIds!: Types.ObjectId[];

  @Prop({ default: true })
  active!: boolean;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
MemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
