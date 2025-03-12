import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team } from './entities/team.schemas';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { create } from 'domain';
import { MatchService } from '@modules/match/match.service';

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<Team>,
    private readonly matchService: MatchService
  ) { }

  //#region create
  async create(createTeamDto: CreateTeamDto) {
    const match = await this.matchService.findOne(createTeamDto.match);

    if (match.match.status !== 'ready') {
      throw new BadRequestException(`For a new match, the status must be 'ready'`);
    }
    const members = createTeamDto.members.map(member => new Types.ObjectId(member));
    const createdTeam = new this.teamModel({
      ...createTeamDto,
      members,
      match: new Types.ObjectId(createTeamDto.match),
    });
    return createdTeam.save();
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