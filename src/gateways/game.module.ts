import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameGateway } from './game.gateway';
import { Match, MatchSchema } from '../modules/match/entities/match.schema';
import { Team, TeamSchema } from '../modules/team/entities/team.schemas';
import { PoolTableModule } from '../modules/pooltable/pooltable.module';
import { UserModule } from '../modules/user/user.module'; // <-- import UserModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
    PoolTableModule,
    UserModule, // <-- add UserModule so that UserService is available
  ],
  providers: [GameGateway],
})
export class GameModule {}