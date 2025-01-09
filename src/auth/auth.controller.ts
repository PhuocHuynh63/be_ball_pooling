import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, ResponseMessage } from 'src/decorator/custom';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { MailerService } from '@nestjs-modules/mailer';
import { CreateAuthDto, UpdateAuthDto } from './dto/create-auth.dto';
import { JwtAuthGuard } from './passport/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailerService: MailerService,
  ) { }

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @ResponseMessage('Login success')
  handleLogin(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
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
  senCodeOTP(@Body('email') email: string) {
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

  // @Post('check-code')
  // @Public()
  // checkCode(@Body() registerDto: CodeAuthDto) {
  //   return this.authService.checkCode(registerDto);
  // }

  // @Post('retry-active')
  // @Public()
  // retryActive(@Body("email") email: string) {
  //   return this.authService.retryActive(email);
  // }

  // @Post('retry-password')
  // @Public()
  // retryPassword(@Body("email") email: string) {
  //   return this.authService.retryPassword(email);
  // }

  @Get('mail')
  @Public()
  testMail() {
    this.mailerService
      .sendMail({
        to: '',
        from: '',
        subject: 'Testing Nest MailerModule ✔',
        text: 'welcome',
        template: 'register',
        context: {
          name: '',
          activationCode: 32198
        }
      })
    return 'ok';
  }
}
