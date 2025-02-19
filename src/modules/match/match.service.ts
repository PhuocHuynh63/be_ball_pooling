import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Match } from './entities/Match.schema';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchResponseDto } from './dto/match-response.dto';
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
    console.log(createMatchDto);
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

  async findOne(id: string): Promise<MatchResponseDto> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }

    // Removed progress-based checks since progress is now managed via the Team entity.
    return { match: match.toObject() };
  }

  async update(id: string, updateMatchDto: UpdateMatchDto): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }

    Object.assign(match, updateMatchDto);
    return match.save();
  }

  // The updateProgress and undoLastProgress methods have been removed since
  // progress is now handled in the Team entity.

  async delete(id: string): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }

    match.status = 'deleted'; // For soft deletion
    match.deletedAt = new Date();
    return match.save();
  }

  async getMatchResult(id: string): Promise<any> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }
  
    // With progress now stored in teams, calculating the result may need to collect
    // and aggregate data from the Team entity. Adapt this logic as needed.
    return { match };
  }
}