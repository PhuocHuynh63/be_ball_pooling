import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/entities/User.schema';
import { Match } from '../../match/entities/Match.schema';

export enum TeamStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class Result {
  @Prop({ required: true, default: 0, min: 0 })
  score: number;

  @Prop({ required: true, default: 0, min: 0 })
  foulCount: number;

  @Prop({ required: true, default: 0, min: 0 })
  strokes: number;
}

export const ResultSchema = SchemaFactory.createForClass(Result);

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class Team extends Document {
  @Prop({ required: true, trim: true })
  teamName: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Match', required: true, index: true })
  match: Types.ObjectId;

  @Prop({ required: true, default: TeamStatus.ACTIVE, enum: TeamStatus })
  status: string;

  @Prop({ type: ResultSchema, default: () => ({}) })
  result: Result;
}

export const TeamSchema = SchemaFactory.createForClass(Team);