import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Store } from './entities/Store.schema';

@Injectable()
export class StoreService {
  constructor(@InjectModel(Store.name) private storeModel: Model<Store>) {}

  async create(createStoreDto: any): Promise<Store> {
    const createdStore = new this.storeModel(createStoreDto);
    return createdStore.save();
  }

  async findAll(): Promise<Store[]> {
    return this.storeModel.find().exec();
  }

  async findOne(id: string): Promise<Store> {
    return this.storeModel.findById(id).exec();
  }

  // Add more methods as needed
}