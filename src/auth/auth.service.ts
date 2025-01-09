import { Injectable } from '@nestjs/common';
import { comparePasswordHelper } from 'src/utils/utils';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto, UpdateAuthDto } from './dto/create-auth.dto';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
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
    const payload = { email: user.email, sub: user._id, fullname: user.fullname, role: user.role, image: user.image, };
    return {
      user: {
        _id: user._id,
        email: user.email,
        fullname: user.fullname,
        image: user.image,
      },
      access_token: this.jwtService.sign(payload),
    }
  }


  handleRegister = async (registerDto: CreateAuthDto) => {
    return await this.userService.handleRegister(registerDto);
  }

  checkActiveCode = async (id: string) => {
    return await this.userService.checkActiveCode(id);
  }

  sendCodeOTP = async (email: string) => {
    return await this.userService.sendCodeOTP(email);
  }

  verifyCode = async (body: { email: string, code: string }) => {
    return await this.userService.verifyCode(body);
  }

  activeAccount = async (body: { email: string }) => {
    return await this.userService.activeAccount(body);
  }

  resetPassword = async (data: UpdateAuthDto) => {
    return await this.userService.resetPassword(data);
  }

  // checkCode = async (data: CodeAuthDto) => {
  //   return await this.userService.handleActive(data);
  // }

  // retryActive = async (email: string) => {
  //   return await this.userService.retryActive(email);
  // }

  // retryPassword = async (email: string) => {
  //   return await this.userService.retryPassword(email);
  // }
}
