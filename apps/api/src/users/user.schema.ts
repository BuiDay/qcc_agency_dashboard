import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// Tài khoản đăng nhập (chỉ trả lời "bạn là ai"). Quyền nằm ở Member.
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  avatar?: string;

  // select: false → không bao giờ trả về trừ khi gọi .select('+passwordHash')
  @Prop({ required: true, select: false })
  passwordHash: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
