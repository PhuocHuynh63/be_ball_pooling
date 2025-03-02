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

  async findUserByAnyThing(query: Record<string, any>): Promise<User> {
    if (!query || Object.keys(query).length === 0) {
      throw new BadRequestException('At least one search parameter must be provided');
    }

    // Tạo một biến chứa điều kiện tìm kiếm
    let searchCriteria: Record<string, any> = {};

    // Lặp qua từng key trong query để xử lý tương ứng
    for (const key in query) {
      switch (key) {
        case '_id':
          if (Types.ObjectId.isValid(query._id)) {
            searchCriteria._id = query._id;
          }
          break;

        case 'email':
          searchCriteria.email = query.email;
          break;

        case 'phone':
          searchCriteria.phone = query.phone;
          break;

        case 'name':
          searchCriteria.name = { $regex: new RegExp(query.name, 'i') }; // Tìm gần đúng
          break;

        case 'role':
          searchCriteria.role = query.role;
          break;

        case 'authProvider':
          if (['local', 'google'].includes(query.authProvider)) {
            searchCriteria.authProvider = query.authProvider;
          }
          break;

        case 'status':
          searchCriteria.status = query.status;
          break;

        default:
          break;
      }
    }

    // Kiểm tra nếu không có tham số hợp lệ nào
    if (Object.keys(searchCriteria).length === 0) {
      throw new BadRequestException('No valid search parameters provided');
    }

    // Thực hiện tìm kiếm
    const user = await this.userModel.findOne(searchCriteria).lean().exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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