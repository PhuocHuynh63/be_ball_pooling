import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';
import { CreateAuthDto } from '../../auth/dto/create-auth.dto';
import { UpdateAuthDto } from '../../auth/dto/update-auth.dto'; // Correct import
import { hashPasswordHelper, comparePasswordHelper } from 'src/utils/utils';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateAuthDto): Promise<User> {
    const hashedPassword = await hashPasswordHelper(createUserDto.password);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      createdAt: new Date(),
      deletedAt: null,
    });
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  async handleRegister(registerDto: CreateAuthDto): Promise<User> {
    const hashedPassword = await hashPasswordHelper(registerDto.password);
    const createdUser = new this.userModel({
      ...registerDto,
      password: hashedPassword,
      createdAt: new Date(),
      deletedAt: null,
    });
    return createdUser.save();
  }

  async checkActiveCode(id: string): Promise<any> {
    // Implement your logic here
  }

  async sendCodeOTP(email: string): Promise<any> {
    // Implement your logic here
  }

  async verifyCode(body: { email: string, code: string }): Promise<any> {
    // Implement your logic here
  }

  async activeAccount(body: { email: string }): Promise<any> {
    // Implement your logic here
  }

  async resetPassword(data: UpdateAuthDto): Promise<any> {
    // Implement your logic here
  }

  // Add more methods as needed
}