import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Store } from '../../store/entities/Store.schema';

@Schema()
export class PoolTable extends Document {
  @Prop({ required: true, unique: true })
  qrCode: string;

  @Prop({ required: true })
  status: string;

  @Prop({
    type: {
      type_name: { type: String, required: true },
      compatible_mode: { type: [String], required: true },
    },
    required: true,
  })
  tableType: {
    type_name: string;
    compatible_mode: string[];
  };

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  store: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: null })
  deletedAt: Date;
}

export const PoolTableSchema = SchemaFactory.createForClass(PoolTable);