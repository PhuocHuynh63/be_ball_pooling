import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/entities/User.schema';
import { PoolTable } from '../../pooltable/entities/PoolTable.schema';

@Schema()
export class Match extends Document {
  @Prop({
    type: [
      {
        user: { type: Types.ObjectId, ref: 'User' },
        team: { type: String, required: false },
        _id: false,
      },
    ],
    required: true,
  })
  users: {
    user: Types.ObjectId;
    team?: string;
  }[];

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  mode_game: string;

  @Prop({
    type: [
      {
        _id: Number,
        player: { type: Types.ObjectId, ref: 'User' },
        ballsPotted: [String], // Store the balls potted in each stroke
        foul: Boolean, // Indicate if the stroke was a foul
      },
    ],
    default: [],
  })
  progress: {
    _id: number;
    player: Types.ObjectId;
    ballsPotted: string[];
    foul: boolean;
  }[];

  @Prop({
    type: {
      name: String,
      score: Number,
      createdAt: Date,
      updatedAt: Date,
    },
    required: false,
  })
  result: {
    name: string;
    score: number;
    createdAt: Date;
    updatedAt: Date;
  };

  @Prop({ type: Types.ObjectId, ref: 'PoolTable', required: true })
  pooltable: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  endAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: null })
  deletedAt: Date;
}

export const MatchSchema = SchemaFactory.createForClass(Match);