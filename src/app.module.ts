import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
// import * as redisStore from 'cache-manager-redis-store';
import { JwtAuthGuard } from './auth/passport/jwt-auth.guard';
import { TransformInterceptor } from './core/transform.interceptor';
import { UserModule } from './modules/user/user.module';
import { PoolTableModule } from './modules/pooltable/pooltable.module';
import { StoreModule } from './modules/store/store.module';
import { MatchModule } from './modules/match/match.module';
import { AuthModule } from './auth/auth.module';
import { TeamModule } from './modules/team/team.module';
import { UploadModule } from './upload/upload.module';
import { GameModule } from './gateways/game.module';
import { RedisModule } from './redis/redis.module';
import Mail from 'nodemailer/lib/mailer';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    // MailerModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: async (configService: ConfigService) => ({
    //     transport: {
    //       host: 'smtp.gmail.com',
    //       port: 465,
    //       secure: true,
    //       auth: {
    //         user: configService.get<string>('MAIL_USER'),
    //         pass: configService.get<string>('MAIL_PASSWORD'),
    //       },
    //     },
    //     defaults: {
    //       from: '"No Reply" <no-reply@localhost>',
    //     },
    //     template: {
    //       dir: './dist/mail/templates',
    //       adapter: new HandlebarsAdapter(),
    //       options: {
    //         strict: true,
    //       },
    //     },
    //   }),
    //   inject: [ConfigService],
    // }),
    // CacheModule.registerAsync({
    //   imports: [ConfigModule],
    //   isGlobal: true,
    //   useFactory: async (configService: ConfigService) => ({
    //     store: redisStore.create(),
    //     host: configService.get<string>('REDIS_HOST'),
    //     port: configService.get<number>('REDIS_PORT'),
    //     ttl: 300,
    //   }),
    //   inject: [ConfigService],
    // }),
    UserModule,
    PoolTableModule,
    StoreModule,
    MatchModule,
    AuthModule,
    StoreModule,
    TeamModule,
    UploadModule,
    GameModule,
    RedisModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule { }
