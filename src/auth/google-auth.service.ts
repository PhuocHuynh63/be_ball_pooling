import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from 'src/modules/user/entities/User.schema';
import { GoogleAuthDto } from './dto/google-auth.dto';

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

  async getGoogleOAuthToken(code: string): Promise<string> {
    const { tokens } = await this.client.getToken(code);
    if (!tokens.id_token) {
      throw new UnauthorizedException('Invalid Google token');
    }
    return tokens.id_token;
  }

  async verify(token: string) {
    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedException('Invalid Google token');
    }
    return payload;
  }

  // Private function that finds or creates a user based on GoogleAuthDto
  private async findOrCreateUser(googleAuthDto: GoogleAuthDto): Promise<User> {
    let user = await this.userModel.findOne({ email: googleAuthDto.email }).exec();
    if (!user) {
      user = new this.userModel({
        name: googleAuthDto.name,
        email: googleAuthDto.email,
        password: '',         // Dummy empty password
        phone: '',
        role: UserRole.USER,
        status: 'active',
        authProvider: 'google',  // Explicitly set as google
      });
      await user.save();
    }
    return user;
  }

  async loginOrSignup(token: string): Promise<{ user: User; access_token: string }> {
    const payload = await this.verify(token);
    const googleAuthDto: GoogleAuthDto = {
      name: payload.name,
      email: payload.email,
    };
    const user = await this.findOrCreateUser(googleAuthDto);
    const accessToken = this.jwtService.sign({ 
      email: user.email, 
      sub: user._id, 
      role: user.role 
    });
    return { user, access_token: accessToken };
  }
}