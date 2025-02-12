import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PoolTable } from './entities/PoolTable.schema';
import { CreatePoolTableDto } from './dto/create-pooltable.dto';
import { UpdatePoolTableDto } from './dto/update-pooltable.dto';

@Injectable()
export class PoolTableService {
  constructor(
    @InjectModel(PoolTable.name) private readonly poolTableModel: Model<PoolTable>
  ) {}

  async create(createPoolTableDto: CreatePoolTableDto): Promise<PoolTable> {
    try {
      const createdPoolTable = new this.poolTableModel(createPoolTableDto);
      return await createdPoolTable.save();
    } catch (error) {
      if (error.code === 11000) { // Duplicate key error code
        throw new ConflictException('QR code already exists');
      }
      throw error;
    }
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
    poolTable.status = 'unavailable';
    return poolTable.save();
  }
}