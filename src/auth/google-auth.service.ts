import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '@modules/user/entities/user.schema';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { UserRoles } from 'src/constant/users.enums';

@Injectable()
export class GoogleAuthService {
  private client: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    this.client = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI')
    );
  }

  async loginOrSignup(user: any): Promise<{ user: User; access_token_jwt: string }> {
    const googleAuthDto: GoogleAuthDto = {
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };
    let existingUser = await this.userModel.findOne({ email: googleAuthDto.email }).exec();
    if (!existingUser) {
      existingUser = new this.userModel({
        name: googleAuthDto.name,
        email: googleAuthDto.email,
        avatar: googleAuthDto.avatar,
        password: '', // Dummy empty password
        phone: '',
        role: UserRoles.USER,
        status: 'active',
        authProvider: 'google', // Explicitly set as google
      });
      await existingUser.save();
    }
    const accessToken = this.jwtService.sign({
      email: existingUser.email,
      sub: existingUser._id,
      role: existingUser.role,
    });
    return { user: existingUser, access_token_jwt: accessToken };
  }
}