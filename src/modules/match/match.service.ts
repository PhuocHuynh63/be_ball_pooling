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


  //#region create
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
  //#endregion

  //#region findAll
  async findAll(): Promise<Match[]> {
    return this.matchModel.find({ deletedAt: null }).exec();
  }
  //#endregion

  //#region findOne
  async findOne(id: string): Promise<MatchResponseDto> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }

    // Removed progress-based checks since progress is now managed via the Team entity.
    return { match: match.toObject() };
  }
  // #endregion 

  //#region update
  async update(id: string, updateMatchDto: UpdateMatchDto): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }

    Object.assign(match, updateMatchDto);
    return match.save();
  }
  // #endregion 

  //#region updateProgress
  async updateProgress(id: string, updateProgressDto: UpdateProgressDto): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }
  
    // Track potted balls
    const pottedBalls = new Set<string>();
    match.progress.forEach(stroke => {
      stroke.ballsPotted.forEach(ball => pottedBalls.add(ball));
    });
  
    // Append new progress items with incremented _id values
    const currentMaxId = match.progress.length > 0 ? Math.max(...match.progress.map(p => p._id)) : 0;
    const newProgress = updateProgressDto.progress.map((stroke, index) => {
      // Check for already potted balls
      stroke.ballsPotted.forEach(ball => {
        if (pottedBalls.has(ball)) {
          throw new BadRequestException(`Ball ${ball} has already been potted`);
        }
        pottedBalls.add(ball);
      });
  
      return {
        _id: currentMaxId + index + 1, // Increment _id
        player: stroke.player,
        ballsPotted: stroke.ballsPotted,
        foul: stroke.foul ?? false, // Ensure foul is always set
      };
    });
  
    match.progress.push(...newProgress);
    match.updatedAt = new Date();
  
    // Check if the 8-ball has been potted and update status to finished
    if (match.mode_game === '8-ball' && newProgress.some(stroke => stroke.ballsPotted.includes('8'))) {
      match.status = 'finished';
    }
  
    // Calculate the score based on the progress
    const gameModeStrategy = new GameModeStrategy(match.mode_game);
    gameModeStrategy.calculateScore(match);
  
    return match.save();
  }
  // #endregion

  //#region undoLastProgress
  async undoLastProgress(id: string): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }

    if (match.progress.length === 0) {
      throw new BadRequestException('No progress to undo');
    }

    // Remove the last progress item
    const lastProgress = match.progress.pop();

    // Update the set of potted balls
    if (lastProgress) {
      lastProgress.ballsPotted.forEach(ball => {
        // Remove the ball from the set of potted balls
        match.progress.forEach(stroke => {
          stroke.ballsPotted = stroke.ballsPotted.filter(pottedBall => pottedBall !== ball);
        });
      });
    }

    match.updatedAt = new Date();
    return match.save();
  }
  // #endregion

  //#region delete
  async delete(id: string): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }

    match.status = 'deleted'; // For soft deletion
    match.deletedAt = new Date();
    return match.save();
  }
  // #endregion

  //#region getMatchResult
  async getMatchResult(id: string): Promise<any> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }
  
    // With progress now stored in teams, calculating the result may need to collect
    // and aggregate data from the Team entity. Adapt this logic as needed.
    return { match };
  }
  // #endregion
}