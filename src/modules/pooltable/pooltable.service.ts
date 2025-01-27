import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PoolTable } from './entities/PoolTable.schema';
import { CreatePoolTableDto } from './dto/create-pooltable.dto';
import { UpdatePoolTableDto } from './dto/update-pooltable.dto';
import { StoreService } from '../store/store.service';

@Injectable()
export class PoolTableService {
  constructor(
    @InjectModel(PoolTable.name) private poolTableModel: Model<PoolTable>,
    private readonly storeService: StoreService,
  ) {}

  async create(createPoolTableDto: CreatePoolTableDto): Promise<PoolTable> {
    const existingPoolTable = await this.poolTableModel.findOne({ qrCode: createPoolTableDto.qrCode }).exec();
    if (existingPoolTable) {
      throw new BadRequestException('QR code already exists');
    }

    const store = await this.storeService.findOne(createPoolTableDto.store);
    if (!store) {
      throw new BadRequestException('Store does not exist');
    }

    const createdPoolTable = new this.poolTableModel(createPoolTableDto);
    return createdPoolTable.save();
  }

  async findAll(): Promise<PoolTable[]> {
    return this.poolTableModel.find({ deletedAt: null }).exec();
  }

  async findOne(id: string): Promise<PoolTable> {
    const poolTable = await this.poolTableModel.findById(id).exec();
    if (!poolTable || poolTable.deletedAt) {
      throw new NotFoundException('Pool table not found');
    }
    return poolTable;
  }

  async update(id: string, updatePoolTableDto: UpdatePoolTableDto): Promise<PoolTable> {
    const poolTable = await this.poolTableModel.findById(id).exec();
    if (!poolTable || poolTable.deletedAt) {
      throw new NotFoundException('Pool table not found');
    }

    Object.assign(poolTable, updatePoolTableDto);
    return poolTable.save();
  }

  async delete(id: string): Promise<PoolTable> {
    const poolTable = await this.poolTableModel.findById(id).exec();
    if (!poolTable || poolTable.deletedAt) {
      throw new NotFoundException('Pool table not found');
    }

    poolTable.deletedAt = new Date();
    return poolTable.save();
  }
}