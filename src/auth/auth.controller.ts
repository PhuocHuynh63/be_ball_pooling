import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, ResponseMessage } from 'src/decorator/custom';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { JwtAuthGuard } from './passport/jwt-auth.guard';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @ResponseMessage('Login success')
  handleLogin(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @Public()
  register(@Body() registerDto: CreateAuthDto) {
    return this.authService.handleRegister(registerDto);
  }

  @Get('active/:id')
  @Public()
  active(@Param('id') id: string) {
    return this.authService.checkActiveCode(id);
  }

  @Post('send-code')
  @Public()
  sendCodeOTP(@Body('email') email: string) {
    return this.authService.sendCodeOTP(email);
  }

  @Post('verify-code')
  @Public()
  verifyCode(@Body() body: { email: string, code: string }) {
    return this.authService.verifyCode(body);
  }

  @Post('active-account')
  @Public()
  activeAccount(@Body() body: { email: string }) {
    return this.authService.activeAccount(body);
  }

  @Post('reset-password')
  @Public()
  resetPassword(@Body() resetPasswordDto: UpdateAuthDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  // Add more endpoints as needed
}