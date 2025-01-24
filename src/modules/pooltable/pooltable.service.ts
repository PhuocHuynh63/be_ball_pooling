import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PoolTable } from './entities/PoolTable.schema';

@Injectable()
export class PoolTableService {
  constructor(@InjectModel(PoolTable.name) private poolTableModel: Model<PoolTable>) {}

  async create(createPoolTableDto: any): Promise<PoolTable> {
    const createdPoolTable = new this.poolTableModel(createPoolTableDto);
    return createdPoolTable.save();
  }

  async findAll(): Promise<PoolTable[]> {
    return this.poolTableModel.find().exec();
  }

  async findOne(id: string): Promise<PoolTable> {
    return this.poolTableModel.findById(id).exec();
  }

  // Add more methods as needed
}