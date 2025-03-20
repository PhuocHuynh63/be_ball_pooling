import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Team, TeamSchema } from './entities/team.schemas';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { MatchModule } from '@modules/match/match.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Team.name, schema: TeamSchema }]),
    MatchModule
  ],
  controllers: [TeamController],
  providers: [TeamService, RolesGuard, JwtAuthGuard],
  exports: [TeamService, MongooseModule]
  
})
export class TeamModule { }