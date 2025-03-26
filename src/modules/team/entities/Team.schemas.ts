import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


class Result {
  @Prop({ required: true, default: 0, min: 0 })
  score: number;

  @Prop({ required: true, default: 0, min: 0 })
  foulCount: number;

  @Prop({ required: true, default: 0, min: 0 })
  strokes: number;
}

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

  @Prop({ default: () => ({}) })
  result: Result;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const TeamSchema = SchemaFactory.createForClass(Team);