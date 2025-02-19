import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team } from './entities/Team.schemas';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamService {
  constructor(@InjectModel(Team.name) private teamModel: Model<Team>) {}

  async create(createTeamDto: CreateTeamDto): Promise<Team> {
    const createdTeam = new this.teamModel(createTeamDto);
    return await createdTeam.save();
  }

  async findAll(): Promise<Team[]> {
    return this.teamModel.find().exec();
  }

  async findOne(id: string): Promise<Team> {
    const team = await this.teamModel.findById(id).exec();
    if (!team) {
      throw new NotFoundException(`Team with id '${id}' not found`);
    }
    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto): Promise<Team> {
    const updatedTeam = await this.teamModel.findByIdAndUpdate(id, updateTeamDto, { new: true }).exec();
    if (!updatedTeam) {
      throw new NotFoundException(`Team with id '${id}' not found`);
    }
    return updatedTeam;
  }

  async findMembers(teamId: string) {
    const team = await this.teamModel.findById(teamId).populate('members').exec();
    if (!team) {
      throw new NotFoundException(`Team with id '${teamId}' not found`);
    }
    return team.members;
  }

  async remove(id: string): Promise<Team> {
    const team = await this.teamModel.findByIdAndDelete(id).exec();
    if (!team) {
      throw new NotFoundException(`Team with id '${id}' not found`);
    }
    return team;
  }
}