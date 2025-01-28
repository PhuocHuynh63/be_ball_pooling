import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/entities/User.schema';

@Schema()
export class Store extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true }) 
  address: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  manager: Types.ObjectId;

  @Prop({ default: 'active' })
  status: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: null })
  deletedAt: Date;
}

export const StoreSchema = SchemaFactory.createForClass(Store);