import { Controller, Post, Body, Request, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, ResponseMessage } from 'src/decorator/custom';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from 'src/upload/upload.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService ) { }

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @ResponseMessage('Login success')
  handleLogin(
    @Body() loginDto: LoginAuthDto,
    @Request() req
  ) {
    console.log('Login payload:', loginDto);
    return this.authService.login(req.user);
  }

  @Post('register')
  @Public()
  @UseInterceptors(FileInterceptor('avatar')) // Lấy file avatar từ request
  register(@Body() registerDto: CreateAuthDto, 
           @UploadedFile() file: Express.Multer.File) {
    return this.authService.handleRegister(registerDto, file);
  }
}