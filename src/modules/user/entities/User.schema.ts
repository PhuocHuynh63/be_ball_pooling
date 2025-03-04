import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
}

export type AuthProvider = 'local' | 'google';

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({default: 'https://asset.cloudinary.com/dfbv4omnx/553d9ff1c8dd8f9bb00c724a56ef7fbd'})
  avatar: string;

  @Prop()
  phone: string;

  // Set password as required only when authProvider is 'local'
  @Prop({
    required: function(this: User) {
      return this.authProvider === 'local';
    },
  })
  password: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ default: 'active' })
  status: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: null })
  deletedAt: Date;

  @Prop()
  otp: string;

  // New field to differentiate auth provider
  @Prop({ required: true, enum: ['local', 'google'], default: 'local' })
  authProvider: string;
}

export const UserSchema = SchemaFactory.createForClass(User);