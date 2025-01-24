import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Store extends Document {
  @Prop({ required: true })
  manager: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;
}

export const StoreSchema = SchemaFactory.createForClass(Store);