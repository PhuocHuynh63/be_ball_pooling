import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { UserRoles } from 'src/constant/users.enums';


export type AuthProvider = 'local' | 'google';

@Schema({ timestamps: true, })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 'https://res.cloudinary.com/dfbv4omnx/image/upload/v1741080748/DALL_E_2025-03-04_16.32.10_-_A_Pixar-style_3D_avatar_of_an_androgynous_character_with_a_friendly_and_casual_expression_styled_for_a_billiards_theme._The_character_has_medium-leng_htcagg.webp' })
  avatar: string;

  @Prop()
  phone: string;

  // Set password as required only when authProvider is 'local'
  @Prop({
    required: function (this: User) {
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

  // New field to differentiate auth provider
  @Prop({ required: true, enum: ['local', 'google'], default: 'local' })
  authProvider: string;
}

export const UserSchema = SchemaFactory.createForClass(User);