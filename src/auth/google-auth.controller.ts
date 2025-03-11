import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';
import { Public, ResponseMessage } from 'src/decorator/custom';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Get()
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // This will redirect to Google login page
  }

  @Get('callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ResponseMessage('Google login success')
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user;
    const { access_token_jwt } = await this.googleAuthService.loginOrSignup(user);

    // Chuyển hướng đến trang HomePage kèm theo dữ liệu
    const redirectUrl = `http://localhost:3000/HomePage?user=${encodeURIComponent(JSON.stringify(user))}&token=${access_token_jwt}`;
    return res.redirect(redirectUrl);
  }s
}