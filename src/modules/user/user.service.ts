import { Injectable, BadRequestException, NotFoundException, ConflictException, UseGuards } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './entities/user.schema';
import { CreateAuthDto } from '../../auth/dto/create-auth.dto';
import { UpdateAuthDto } from '../../auth/dto/update-auth.dto';
import { hashPasswordHelper, comparePasswordHelper } from 'src/utils/utils';
import { MailService } from 'src/mail/mail.service';
import { UploadService } from 'src/upload/upload.service';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { FindUserDto } from './dto/user.dto';
import { updateUsersAdminDto } from './dto/update-userAdmin.dto';
import { updateUsersDto } from './dto/update-user.dto ';

@Injectable()
@UseGuards(RolesGuard)
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly uploadService: UploadService,
  ) { }

  //#region createUser 
  async createUser(createUserDto: CreateAuthDto): Promise<User> {
    // Ensure authProvider defaults to 'local' if not provided
    if (!createUserDto.authProvider) {
      createUserDto.authProvider = 'local';
    }

    // Enforce the strong password regex for local registration
    if (createUserDto.authProvider === 'local') {
      const hashedPassword = await hashPasswordHelper(createUserDto.password);
      createUserDto.password = hashedPassword;
    }

    const createdUser = new this.userModel({
      ...createUserDto,
    });
    return createdUser.save();
  }
  //#endregion

  //#region updateUserAdmin  
  async updateUserAdmin(id: string, updateUsers: updateUsersAdminDto): Promise<User> {

    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUsers.authProvider === 'local') {
      const hashedPassword = await hashPasswordHelper(updateUsers.password);
      updateUsers.password = hashedPassword;
    }

    Object.assign(user, updateUsers);
    return await user.save();
  }
  //#endregion

  //#region updateUser
  async updateUser(id: string, updateUsers: updateUsersDto): Promise<User> {

    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUsers.authProvider === 'local' && updateUsers.passwordNew) {
      const isPasswordMatch = await comparePasswordHelper(updateUsers.password, user.password);
      if (isPasswordMatch) {
        const hashedPassword = await hashPasswordHelper(updateUsers.passwordNew);
        updateUsers.password = hashedPassword;
      } else {
        throw new BadRequestException('Current password is incorrect');
      }
      delete updateUsers.passwordNew; // Remove passwordNew from the update object
    }

    Object.assign(user, updateUsers);
    return await user.save();
  }
  //#endregionF

  //#region updateUserAvatar 
  async updateUserAvatar(id: string, file?: Express.Multer.File): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (file) {
      const folder = 'avatar';
      const urlAvatar = await this.uploadService.uploadImage(file, folder, user.avatar);
      user.avatar = urlAvatar; // Set lại URL vào thuộc tính avatar
    }

    return await user.save();
  }
  //#endregion

  //#region delete
  async delete(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.status = 'inactive'; // Set status to inactive for soft deletion
    return user.save();
  }
  //#endregion

  //#region findAll
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }
  //#endregion

  //#region find
  async find(query: any): Promise<User[]> {
    console.log('Query parameters:', query); // Logging query parameters

    // Nếu không có tham số truy vấn, trả về tất cả người dùng
    if (Object.keys(query).length === 0) {
      return this.findAll();
    }

    // Xây dựng đối tượng truy vấn động
    const queryObject: any = {};

    for (const key in query) {
      if (query.hasOwnProperty(key)) {
        switch (key) {
          case 'id':
            queryObject._id = query[key];
            break;
          case 'name':
            queryObject.name = query[key];
            break;
          case 'email':
            queryObject.email = query[key];
            break;
          case 'role':
            queryObject.role = query[key];
            break;
          default:
            console.log(`Unknown query parameter: ${key}`);
        }
      }
    }

    console.log('Query object:', queryObject); // Logging query object
    const users = await this.userModel.find(queryObject).exec();
    console.log('Found users:', users); // Logging found users
    return users;
  }
  //#endregion

  //#region findUserBySearchOrFilter
  async findUserBySearchOrFilter(query: FindUserDto) {

    //#region Pagination
    const currentPage = query.current ? Number(query.current) : 1;
    const pageSizePage = query.pageSize ? Number(query.pageSize) : 10;
    let skip = (currentPage - 1) * pageSizePage;
    //#endregion

    //#region Filter
    const filterConditions: Record<string, any> = {};

    if (query.term) {
      filterConditions
        .$or = [
          { name: new RegExp(query.term, 'i') },
          { email: new RegExp(query.term, 'i') },
          { phone: new RegExp(query.term, 'i') },
        ]
    };

    if (query.role) {
      filterConditions.role = query.role;
    }

    if (query.status) {
      filterConditions.status = query.status;
    }
    //#endregion

    //#region Sort
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'email', 'phone', 'status'];
    const sortField = allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
    const sortDirection = query.sortDirection === 'desc' ? -1 : 1;
    //#endregion

    const [result, totalItem] = await Promise.all([
      this.userModel
        .find(filterConditions)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(pageSizePage)
        .lean(),
      this.userModel.countDocuments(filterConditions)
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

  //#region findOne
  async findOne(id: string | Types.ObjectId): Promise<User> {
    const user = await this.userModel.findById(id || new Types.ObjectId(id)).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
  //#endregion

  //#region findEmail
  async findEmail(email: string): Promise<User> {
    const user = await this
      .userModel.findOne({ email: email }).exec();
    if (!user) {
      throw new NotFoundException(`User with Email ${email} not found`);
    }
    return user;
  }
  //#endregion

  //#region findEmailandPassword
  async findEmailandPassword(email: string, password: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new NotFoundException('Invalid email or password');
    }

    return user;
  }
  //#endregion

  //#region findOneByEmail
  async findByEmail(email: string): Promise<User> {
    console.log('UserService: findByEmail: email:', email); // Debugging statement
    const user = await this.userModel.findOne({ email: email }).exec();
    console.log('UserService: findByEmail: user:', user); // Debugging statement
    return user;
  }
  //#endregion

  //#region activateAccount
  async activeAccount(body: { email: string }): Promise<any> {
    const { email } = body; // Ensure email is declared
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.status === 'active') {
      throw new BadRequestException('User is already active');
    }
    user.status = 'active';
    await user.save();
    return { message: 'Account activated' };
  }
  //#endregion

  //#region resetPassword
  async resetPassword(data: UpdateAuthDto): Promise<any> {
    const { email, password } = data; // Ensure email is declared
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const hashedPassword = await hashPasswordHelper(password);
    user.password = hashedPassword;
    await user.save();
    return { message: 'Password reset successful' };
  }
  //#endregion

  //#region checkActiveCode
  async checkActiveCode(id: string): Promise<any> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.status === 'active') {
      throw new BadRequestException('User is already active');
    }
    return { status: user.status };
  }
  //#endregion


}