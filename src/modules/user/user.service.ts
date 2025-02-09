import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/User.schema';
import { CreateAuthDto } from '../../auth/dto/create-auth.dto';
import { UpdateAuthDto } from '../../auth/dto/update-auth.dto';
import { hashPasswordHelper, comparePasswordHelper } from 'src/utils/utils';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly mailService: MailService,
  ) { }

  async create(createUserDto: CreateAuthDto): Promise<User> {
    // // Strong password regex
    // const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    // // Validate password strength
    // if (!strongPasswordRegex.test(createUserDto.password)) {
    //   throw new BadRequestException('Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
    // }

    const hashedPassword = await hashPasswordHelper(createUserDto.password);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      createdAt: new Date(),
      deletedAt: null,
    });
    return createdUser.save();
  }

  async createUser(createUserDto: CreateAuthDto): Promise<User> {
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
    console.log('UserService: findByEmail: email:', email); // Debugging statement
    const user = await this.userModel.findOne({ email: email }).exec();
    console.log('UserService: findByEmail: user:', user); // Debugging statement
    return user;
  }

  async sendCodeOTP(email: string): Promise<any> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    user.otp = otp;
    await user.save();
    await this.mailService.sendMail(email, 'Your OTP Code', `Your OTP code is ${otp}`);
    return { message: 'OTP sent' };
  }

  async verifyCode(body: { email: string, code: string }): Promise<any> {
    const { email, code } = body; // Ensure email is declared
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.otp !== code) {
      throw new BadRequestException('Invalid OTP code');
    }
    user.otp = null; // Clear the OTP after verification
    await user.save();
    return { message: 'OTP verified' };
  }

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

  async delete(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.status = 'inactive'; // Set status to inactive for soft deletion
    return user.save();
  }

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
}