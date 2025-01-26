import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { comparePasswordHelper, hashPasswordHelper } from 'src/utils/utils';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UserService } from 'src/modules/user/user.service';
import { UserRole } from '@modules/user/entities/User.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    console.log('AuthService: validateUser: email:', email); // Debugging statement
    const user = await this.userService.findByEmail(email);
    console.log('AuthService: validateUser: user:', user); // Debugging statement
    if (!user) {
      return null;
    }

    const isMatch = await comparePasswordHelper(password, user.password);
    if (!isMatch) {
      return undefined;
    }

    return user;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id, fullname: user.fullname, role: user.role, image: user.image };
    return {
      user: {
        _id: user._id,
        email: user.email,
        fullname: user.fullname,
        image: user.image,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async handleRegister(registerDto: CreateAuthDto) {
    if (registerDto.role !== UserRole.USER) {
      throw new BadRequestException('Only user role can be assigned during registration');
    }
    const hashedPassword = await hashPasswordHelper(registerDto.password);
    const createdUser = new this.userService.userModel({
      ...registerDto,
      password: hashedPassword,
      createdAt: new Date(),
      deletedAt: null,
    });
    try {
      return await createdUser.save();
    } catch (error) {
      if (error.code === 11000) { // Duplicate key error code
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async checkActiveCode(id: string) {
    return await this.userService.checkActiveCode(id);
  }

  async sendCodeOTP(email: string) {
    return await this.userService.sendCodeOTP(email);
  }

  async verifyCode(body: { email: string, code: string }) {
    return await this.userService.verifyCode(body);
  }

  async activeAccount(body: { email: string }) {
    return await this.userService.activeAccount(body);
  }

  async resetPassword(data: UpdateAuthDto) {
    return await this.userService.resetPassword(data);
  }

  // Add more methods as needed
}
