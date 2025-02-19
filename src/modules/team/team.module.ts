import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Team, TeamSchema } from './entities/Team.schemas';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Team.name, schema: TeamSchema }])],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}