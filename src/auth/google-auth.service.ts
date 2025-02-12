import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/modules/user/entities/User.schema';

@Injectable()
export class GoogleAuthService {
  private client: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
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

  async loginOrSignup(payload: any) {
    let user = await this.userService.findByEmail(payload.email);
    if (!user) {
      user = await this.userService.create({
        name: payload.name,
        email: payload.email,
        password: '', // No password needed for Google login
        phone: '', // You can ask for phone number later
        role: UserRole.USER,
        status: 'active',
      });
    }
    const accessToken = this.jwtService.sign({ email: user.email, sub: user._id, role: user.role });
    return { user, access_token: accessToken };
  }
}