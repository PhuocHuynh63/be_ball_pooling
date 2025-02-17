import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/entities/User.schema';
import { Match } from '../../match/entities/Match.schema';

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class Team extends Document {
  @Prop({ required: true })
  teamName: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Match', required: true })
  match: Types.ObjectId;

  @Prop({ required: true, default: 'active' })
  status: string;

  @Prop({ required: true, default: 0 })
  score: number;

  @Prop({ required: true, default: 0 })
  foulCount: number;

  @Prop({ required: true, default: 0 })
  stroke: number;
}

export const TeamSchema = SchemaFactory.createForClass(Team);