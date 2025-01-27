import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Match } from './entities/Match.schema';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { UserService } from '../user/user.service';
import { PoolTableService } from '../pooltable/pooltable.service';

@Injectable()
export class MatchService {
  constructor(
    @InjectModel(Match.name) private matchModel: Model<Match>,
    private readonly userService: UserService,
    private readonly poolTableService: PoolTableService,
  ) {}

  async create(createMatchDto: CreateMatchDto): Promise<Match> {
    for (const user of createMatchDto.users) {
      const existingUser = await this.userService.findOne(user.user);
      if (!existingUser) {
        throw new BadRequestException(`User with ID ${user.user} does not exist`);
      }
    }

    const poolTable = await this.poolTableService.findOne(createMatchDto.pooltable);
    if (!poolTable) {
      throw new BadRequestException(`Pool table with ID ${createMatchDto.pooltable} does not exist`);
    }

    const createdMatch = new this.matchModel(createMatchDto);
    return createdMatch.save();
  }

  async findAll(): Promise<Match[]> {
    return this.matchModel.find({ deletedAt: null }).exec();
  }

  async findOne(id: string): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }
    return match;
  }

  async update(id: string, updateMatchDto: UpdateMatchDto): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }

    Object.assign(match, updateMatchDto);
    return match.save();
  }

  async updateProgress(id: string, updateProgressDto: UpdateProgressDto): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }

    match.progress = updateProgressDto.progress.map((stroke) => ({
      ...stroke,
      action: this.generateActionDescription(stroke),
    }));
    match.updatedAt = new Date();

    // Calculate the score based on the progress
    this.calculateScore(match);

    return match.save();
  }

  async delete(id: string): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }

    match.deletedAt = new Date();
    return match.save();
  }

  private generateActionDescription(stroke: { ballsPotted: string[]; foul: boolean }): string {
    if (stroke.foul) {
      return `Foul committed`;
    }
    if (stroke.ballsPotted.length === 0) {
      return `No balls potted`;
    }
    return `Potted balls: ${stroke.ballsPotted.join(', ')}`;
  }

  private calculateScore(match: Match) {
    // Implement your score calculation logic here
    // For example, sum up the scores for each player
    const scores = match.progress.reduce((acc: Record<string, number>, progress) => {
      acc[progress.player.toString()] = (acc[progress.player.toString()] || 0) + progress.ballsPotted.length;
      return acc;
    }, {});

    // Update the result field with the calculated scores
    match.result = {
      name: 'Match Result',
      score: Math.max(...Object.values(scores)),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}