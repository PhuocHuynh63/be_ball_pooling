import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { Match, MatchSchema } from '../../schemas/match.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { PoolTable, PoolTableSchema } from '../../schemas/pooltable.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: User.name, schema: UserSchema },
      { name: PoolTable.name, schema: PoolTableSchema },
    ]),
  ],
  providers: [MatchService],
  controllers: [MatchController],
})
export class MatchModule {}