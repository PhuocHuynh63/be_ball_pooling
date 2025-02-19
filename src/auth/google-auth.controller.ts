import { Controller, Post, Body, Get, Query, Res, UseGuards } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';
import { Public, ResponseMessage } from 'src/decorator/custom';
import { Response } from 'express';

@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Post()
  @Public()
  @ResponseMessage('Google login success')
  async googleLogin(@Body('token') token: string) {
    // Pass the token string directly to loginOrSignup
    return this.googleAuthService.loginOrSignup(token);
  }

  @Get('callback')
  @Public()
  @ResponseMessage('Google login success')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    const token = await this.googleAuthService.getGoogleOAuthToken(code);
    // Pass the token string directly to loginOrSignup
    const { access_token } = await this.googleAuthService.loginOrSignup(token);
    // Redirect to your frontend application with the access token
    return res.redirect(`http://localhost:3000?token=${access_token}`);
  }
}