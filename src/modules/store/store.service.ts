import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
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

    // Ensure the manager doesn't already manage a store
    const existingManagerStore = await this.storeModel.findOne({ manager: createStoreDto.manager }).exec();
    if (existingManagerStore) {
      throw new ConflictException('Manager already manages a store');
    }

    // Normalize the address for comparison
    const normalizedAddress = createStoreDto.address.trim().toLowerCase();

    // Check if a store with the same address already exists
    const existingStore = await this.storeModel.findOne({ address: normalizedAddress }).exec();
    if (existingStore) {
      throw new ConflictException('Store with this address already exists');
    }

    try {
      // Trim the address for storage
      const trimmedAddress = createStoreDto.address.trim();
      const createdStore = new this.storeModel({
        ...createStoreDto,
        address: trimmedAddress,
      });
      return await createdStore.save();
    } catch (error) {
      if (error.code === 11000) { // Duplicate key error
        throw new ConflictException('Store with this address already exists');
      }
      throw error;
    }
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

      // Check that this manager is not already assigned to a different store
      const managerStore = await this.storeModel.findOne({ 
        manager: updateStoreDto.manager, 
        _id: { $ne: id } 
      }).exec();
      if (managerStore) {
        throw new ConflictException('Manager already manages another store');
      }
    }
  
    Object.assign(existingStore, updateStoreDto);
    try {
      return await existingStore.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Store with this address already exists');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Store> {
    const store = await this.storeModel.findById(id).exec();
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    store.status = 'inactive'; // soft deletion
    store.deletedAt = new Date();
    return store.save();
  }
}