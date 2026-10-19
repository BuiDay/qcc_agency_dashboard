import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { MemberStatus, WorkspaceRole } from '@qcc/shared';

// Member = vai trò của một User trong một Workspace ("bạn được làm gì ở đây").
// leaderIds / memberIds / ownerId ở dự án và task đều trỏ tới Member._id.
@Schema({ timestamps: true })
export class Member {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: WorkspaceRole, required: true })
  role: WorkspaceRole;

  // Chuyên môn: design, video_edit, content, execution...
  @Prop({ type: [String], default: [] })
  skills: string[];

  // Chỉ dùng cho role client (giai đoạn sau): khách hàng nào
  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Client', default: [] })
  clientIds: Types.ObjectId[];

  @Prop({ type: String, enum: MemberStatus, default: MemberStatus.Active })
  status: MemberStatus;
}

export type MemberDocument = HydratedDocument<Member>;
export const MemberSchema = SchemaFactory.createForClass(Member);
MemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
