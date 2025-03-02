import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/modules/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './passport/local.strategy';
import { JwtStrategy } from './passport/jwt.strategy';
import { JwtAuthGuard } from './passport/jwt-auth.guard';
import { RolesGuard } from './passport/roles.guard';
import { GoogleAuthService } from './google-auth.service';
import { GoogleAuthController } from './google-auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@modules/user/entities/user.schema';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), // <-- Add this!
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRED') },
      }),
      inject: [ConfigService],
    }),
    PassportModule,
  ],
  controllers: [AuthController, GoogleAuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtAuthGuard, RolesGuard, GoogleAuthService],
  exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}