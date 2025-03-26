import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './entities/user.schema';
import { MailModule } from 'src/mail/mail.module';
import { UploadModule } from 'src/upload/upload.module';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MailModule,
    UploadModule,
  ],
  controllers: [UserController],
  providers: [UserService, RolesGuard, JwtAuthGuard],
  exports: [UserService, MongooseModule],
})
export class UserModule {}