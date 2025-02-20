import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/entities/User.schema';

@Schema({ timestamps: true }) //  Bật timestamps để tự động thêm createdAt & updatedAt
export class Store extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true }) 
  address: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  manager: Types.ObjectId;

  @Prop({ default: false }) // Boolean hợp lệ
  isDeleted: boolean;

  @Prop({ type: Date, default: null }) // Xác định kiểu Date rõ ràng
  deletedAt: Date | null;
}

export const StoreSchema = SchemaFactory.createForClass(Store);
