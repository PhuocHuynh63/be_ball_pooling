import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Store } from './entities/store.schema';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UserService } from '../user/user.service';
import { UserRoles } from 'src/constant/users.enums';
import { User } from '@modules/user/entities/user.schema';
import { FindStoreDto } from './dto/store.dto';
import { PoolTableService } from '@modules/pooltable/pooltable.service';
import { PoolTable } from '@modules/pooltable/entities/poolTable.schema';

@Injectable()
export class StoreService {
  constructor(
    @InjectModel(Store.name) private storeModel: Model<Store>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly userService: UserService,
  ) { }

  //#region create
  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    // Check if the manager exists and has the role of manager
    const manager = await this.userService.findOne(createStoreDto.manager);
    if (!manager) {
      throw new BadRequestException('Manager does not exist');
    }
    if (manager.role !== UserRoles.MANAGER) {
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
        manager: new Types.ObjectId(createStoreDto.manager)
      });
      return await createdStore.save();


    } catch (error) {
      if (error.code === 11000) { // Duplicate key error
        throw new ConflictException('Store with this address already exists');
      }
      throw error;
    }
  }
  //#endregion

  //#region update
  async update(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const existingStore = await this.storeModel.findById(id).exec();
    if (!existingStore) {
      throw new NotFoundException('Store not found');
    }

    // Check if the manager is being updated and validate the new manager
    if (updateStoreDto.manager && updateStoreDto.manager !== existingStore.manager.toString()) {
      const manager = await this.userService.findOne(updateStoreDto.manager);
      if (!manager) {
        throw new BadRequestException('Manager does not exist');
      }
      if (manager.role !== UserRoles.MANAGER) {
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

    // Check if the address is being updated and validate the new address
    if (updateStoreDto.address && updateStoreDto.address.trim().toLowerCase() !== existingStore.address.trim().toLowerCase()) {
      const normalizedAddress = updateStoreDto.address.trim().toLowerCase();
      const existingStoreWithAddress = await this.storeModel.findOne({
        address: normalizedAddress,
        _id: { $ne: id }
      }).exec();
      if (existingStoreWithAddress) {
        throw new ConflictException('Store with this address already exists');
      }
    } else {
      // If the address is the same, remove it from the update DTO to avoid unnecessary update
      delete updateStoreDto.address;
    }

    // If no conflicts, update the store
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
  //#endregion

  //#region delete
  async delete(id: string) {
    try {
      const softDeleteStore = await this.storeModel.findByIdAndUpdate(
        id,
        [
          {
            $set: {
              isDeleted: { $not: "$isDeleted" },
              deletedAt: { $cond: { if: { $eq: ["$isDeleted", false] }, then: new Date(), else: null } }
            }
          }
        ],
        { new: true }
      ).exec();

      if (!softDeleteStore) {
        throw new NotFoundException(`No data found for id ${id}`);
      }
      return {
        data: {
          _id: softDeleteStore._id,
          name: softDeleteStore.name,
          isDeleted: softDeleteStore.isDeleted,
          deletedAt: softDeleteStore.deletedAt
        },
        message: 'Deleted successfully'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Error');
    }
  }
  //#endregion

  //#region findStoreBySearchOrFilter
  async findStoreBySearchOrFilter(query: FindStoreDto) {
    //#region Pagination
    const currentPage = query.current ? Number(query.current) : 1;
    const pageSizePage = query.pageSize ? Number(query.pageSize) : 10;
    let skip = (currentPage - 1) * pageSizePage;
    //#endregion

    //#region Filter
    const filter: any = {};
    if (query.term) {
      filter.name = new RegExp(query.term, 'i');
    }
    //#endregion

    //#region Sort
    const sort: any = {};
    sort[query.sortBy] = query.sortDirection === 'asc' ? 1 : -1;
    //#endregion

    const [result, totalItem] = await Promise.all([
      this.storeModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pageSizePage)
        .lean(),
      this.storeModel.countDocuments(filter)
    ]);

    const totalPage = Math.ceil(totalItem / pageSizePage);

    return {
      data: result,
      pagination: {
        currentPage: currentPage,
        pageSize: pageSizePage,
        totalPage: totalPage,
        totalItem: totalItem,
      }
    };
  }
  //#endregion

  //#region findAll
  async findAll(): Promise<Store[]> {
    return this.storeModel.find().exec();
  }
  //#endregion

  //#region findOne
  async findOne(id: string): Promise<Store> {
    return this.storeModel.findById(id).exec();
  }
  //#endregion

  //#region showDeleted
  async showDeleted(): Promise<Store[]> {
    return this.storeModel.find({ isDeleted: true }).exec();
  }
  //#endregion

  //#region findManagersWithoutStore
  async findManagersWithoutStore(): Promise<User[]> {
    const allManagers = await this.userModel.find({ role: UserRoles.MANAGER }).exec();

    const managersWithStore: Types.ObjectId[] = (await this.storeModel.find().distinct('manager')) as Types.ObjectId[];

    // Lọc danh sách manager chưa có store
    const managersWithoutStore = allManagers.filter(manager =>
      !managersWithStore.some(managerWithStore =>
        new Types.ObjectId(managerWithStore).equals(manager._id.toString())
      )
    );

    return managersWithoutStore;
  }
  //#endregion

}