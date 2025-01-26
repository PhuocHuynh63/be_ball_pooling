import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Store } from './entities/store.schema';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/entities/User.schema';

@Injectable()
export class StoreService {
  constructor(
    @InjectModel(Store.name) private storeModel: Model<Store>,
    private readonly userService: UserService,
  ) {}

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    // Check if the manager exists and has the role of manager
    const manager = await this.userService.findOne(createStoreDto.manager);
    if (!manager) {
      throw new BadRequestException('Manager does not exist');
    }
    if (manager.role !== UserRole.MANAGER) {
      throw new BadRequestException('User is not a manager');
    }

    const createdStore = new this.storeModel(createStoreDto);
    return createdStore.save();
  }

  async findAll(): Promise<Store[]> {
    return this.storeModel.find().exec();
  }

  async findOne(id: string): Promise<Store> {
    return this.storeModel.findById(id).exec();
  }

  async update(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const existingStore = await this.storeModel.findById(id).exec();
    if (!existingStore) {
      throw new NotFoundException('Store not found');
    }

    if (updateStoreDto.manager) {
      const manager = await this.userService.findOne(updateStoreDto.manager);
      if (!manager) {
        throw new BadRequestException('Manager does not exist');
      }
      if (manager.role !== UserRole.MANAGER) {
        throw new BadRequestException('User is not a manager');
      }
    }

    Object.assign(existingStore, updateStoreDto);
    return existingStore.save();
  }

  // Add more methods as needed
}