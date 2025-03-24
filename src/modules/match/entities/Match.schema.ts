import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PoolTable } from '../../pooltable/entities/poolTable.schema';

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class Match extends Document {
  @Prop({ required: true })
  status: string;

  @Prop({ type: String, default: null, required: false })
  mode_game: string;

  @Prop({ type: Types.ObjectId, ref: 'PoolTable', required: true })
  pooltable: Types.ObjectId;

  @Prop()
  endAt: Date;

  @Prop({ default: null })
  deletedAt: Date;
}

export const MatchSchema = SchemaFactory.createForClass(Match);