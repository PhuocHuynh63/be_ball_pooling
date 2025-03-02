import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team } from './entities/team.schemas';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamService {
  constructor(@InjectModel(Team.name) private teamModel: Model<Team>) {}

  //#region create
  create(createTeamDto: CreateTeamDto) {
    const createdTeam =  this.teamModel.create(createTeamDto);
    return createdTeam;
  }
  //#endregion

  //#region findAll
  async findAll(): Promise<Team[]> {
    return this.teamModel.find().exec();
  }
  //#endregion

  //#region findOne
  async findOne(id: string): Promise<Team> {
    const team = await this.teamModel.findById(id).exec();
    if (!team) {
      throw new NotFoundException(`Team with id '${id}' not found`);
    }
    return team;
  }
  //#endregion

  //#region update
  async update(id: string, updateTeamDto: UpdateTeamDto): Promise<Team> {
    const updatedTeam = await this.teamModel.findByIdAndUpdate(id, updateTeamDto, { new: true }).exec();
    if (!updatedTeam) {
      throw new NotFoundException(`Team with id '${id}' not found`);
    }
    return updatedTeam;
  }
  //#endregion

  //#region findMembers
  async findMembers(teamId: string) {
    const team = await this.teamModel.findById(teamId).populate('members').exec();
    if (!team) {
      throw new NotFoundException(`Team with id '${teamId}' not found`);
    }
    return team.members;
  }
   //#endregion

  //#region remove
  async remove(id: string): Promise<Team> {
    const team = await this.teamModel.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date()
        }
      },
      { new: true }
    ).exec();
  
    if (!team) {
      throw new NotFoundException(`Team with id '${id}' not found`);
    }
    return team;
  }
  //#endregion
 
}