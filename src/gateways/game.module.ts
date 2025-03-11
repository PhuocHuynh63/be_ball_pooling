import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Match, MatchSchema } from '@modules/match/entities/match.schema';
import { Team, TeamSchema } from '@modules/team/entities/team.schemas';
import { PoolTableModule } from '@modules/pooltable/pooltable.module';
import { UserModule } from '@modules/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
    PoolTableModule,
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [GameGateway],
})
export class GameModule {}