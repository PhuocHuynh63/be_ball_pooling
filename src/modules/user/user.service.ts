import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './entities/user.schema';
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

  //#region createUser 
  async createUser(createUserDto: CreateAuthDto): Promise<User> {
    // Ensure authProvider defaults to 'local' if not provided
    if (!createUserDto.authProvider) {
      createUserDto.authProvider = 'local';
    }

    // Log the incoming password to debug its plain-text value
    // console.log('Incoming password:', createUserDto.password);

    // Enforce the strong password regex for local registration
    if (createUserDto.authProvider === 'local') {
     
      const hashedPassword = await hashPasswordHelper(createUserDto.password);
      createUserDto.password = hashedPassword;
    }

    const createdUser = new this.userModel({
      ...createUserDto,
      createdAt: new Date(),
      deletedAt: null,
    });
    return createdUser.save();
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

  //#region findOne
  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    
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

  //#region sendCodeOTP
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
  //#endregion

  //#region verifyCode
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