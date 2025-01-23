import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';
import { PoolTable } from './PoolTable.schema';

@Schema()
export class Match extends Document {
    @Prop({
        type: [
          {
            user: { type: Types.ObjectId, ref: 'User' },
            team: String,
          },
        ],
        required: true,
      })
      users: {
        user: Types.ObjectId;
        team: string;
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
        score: [Number],
        status: String,
      },
    ],
  })
  progress: {
    _id: number;
    player: Types.ObjectId;
    score: number[];
    status: string;
  }[];

  @Prop({
    type: {
      name: String,
      score: Number,
      createdAt: Date,
      updatedAt: Date,
    },
  })
  result: {
    name: string;
    score: number;
    createdAt: Date;
    updatedAt: Date;
  };

  @Prop({ type: [{ type: Types.ObjectId, ref: 'PoolTable' }] })
  pooltable: Types.ObjectId[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  endAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const MatchSchema = SchemaFactory.createForClass(Match);