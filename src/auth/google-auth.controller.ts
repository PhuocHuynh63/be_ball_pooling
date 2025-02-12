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
    const payload = await this.googleAuthService.verify(token);
    return this.googleAuthService.loginOrSignup(payload);
  }

  @Get('callback')
  @Public()
  @ResponseMessage('Google login success')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    const token = await this.googleAuthService.getGoogleOAuthToken(code);
    const payload = await this.googleAuthService.verify(token);
    const { access_token } = await this.googleAuthService.loginOrSignup(payload);
    // Redirect to your frontend application with the access token
    return res.redirect(`http://localhost:3001?token=${access_token}`);
  }
}