import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/entities/User.schema';

@Schema()
export class Store extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  address: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  manager: Types.ObjectId;
}

export const StoreSchema = SchemaFactory.createForClass(Store);