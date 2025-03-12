import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Match } from './entities/match.schema';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchResponseDto } from './dto/match-response.dto';
import { UserService } from '../user/user.service';
import { PoolTableService } from '../pooltable/pooltable.service';
import { FindMatchDto } from './dto/find-match.dto';
import { getSortOptions } from 'src/utils/utils';

@Injectable()
export class MatchService {
  constructor(
    @InjectModel(Match.name) private matchModel: Model<Match>,
    private readonly userService: UserService,
    private readonly poolTableService: PoolTableService,
  ) { }

  //#region create
  async create(createMatchDto: CreateMatchDto): Promise<Match> {

    const poolTable = await this.poolTableService.findOne(createMatchDto.pooltable);
    if (!poolTable) {
      throw new BadRequestException(`Pool table with ID ${createMatchDto.pooltable} does not exist`);
    }

    const createdMatch = new this.matchModel({
      ...createMatchDto,
      pooltable: new Types.ObjectId(createMatchDto.pooltable)
    });
    return createdMatch.save();
  }
  //#endregion

  //#region update
  async update(id: string, updateMatchDto: UpdateMatchDto): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }

    Object.assign(match, updateMatchDto);
    return match.save();
  }
  //#endregion

  //#region delete
  async delete(id: string): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException('Match not found');
    }

    match.status = 'deleted';
    match.deletedAt = new Date();
    return match.save();
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
  //#endregion

  //#region findMatchBySearchOrFilter
  async findMatchBySearchOrFilter(query: FindMatchDto) {
    //#region Pagination
    const currentPage = query.current ? Number(query.current) : 1;
    const pageSizePage = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (currentPage - 1) * pageSizePage;
    //#endregion

    //#region Filter
    const filterConditions: Record<string, any> = {};

    if (query.status) {
      filterConditions.status = query.status;
    }

    if (query.mode_game) {
      filterConditions.mode_game = query.mode_game;
    }
    //#endregion

    //#region Sort
    const allowedSortFields = ['createdAt', 'updatedAt', 'status', 'mode_game'];
    const sortOptions = getSortOptions(query.sortBy, query.sortDirection, allowedSortFields);
    //#endregion

    const [result, totalItem] = await Promise.all([
      this.matchModel
        .find(filterConditions)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSizePage)
        .lean(),
      this.matchModel.countDocuments(filterConditions)
    ]);

    const totalPage = Math.ceil(totalItem / pageSizePage);

    return {
      data: result,
      pagination: {
        current: currentPage,
        pageSize: pageSizePage,
        totalPage: totalPage,
        totalItem: totalItem,
      }
    }
  }
  //#endregion

}