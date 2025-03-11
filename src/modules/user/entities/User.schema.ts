import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { UserRoles } from 'src/constant/users.enums';


export type AuthProvider = 'local' | 'google';

@Schema({ timestamps: true,})
export class User{
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

  @Prop({ default: UserRoles.USER })
  role: UserRoles;

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