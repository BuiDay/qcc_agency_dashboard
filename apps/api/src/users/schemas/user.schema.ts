import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ type: String, required: true, select: false })
  passwordHash!: string;

  @Prop({ type: String, trim: true })
  avatar?: string;

  @Prop({ type: Boolean, default: true })
  active!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
