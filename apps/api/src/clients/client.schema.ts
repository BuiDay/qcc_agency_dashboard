import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

@Schema({ _id: false })
export class ContactInfo {
  @Prop() contactName?: string;
  @Prop() phone?: string;
  @Prop() email?: string;
  @Prop() note?: string;
}

// Khách hàng của agency
@Schema({ timestamps: true })
export class Client {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  logo?: string;

  @Prop({ type: ContactInfo, default: () => ({}) })
  contactInfo: ContactInfo;

  @Prop({ default: false })
  archived: boolean;
}

export type ClientDocument = HydratedDocument<Client>;
export const ClientSchema = SchemaFactory.createForClass(Client);
