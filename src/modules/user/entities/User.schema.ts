import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
}

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  avatar: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: null })
  deletedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);