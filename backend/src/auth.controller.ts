import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Get
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body('email') email: string) {
    return this.auth.register(email);
  }

  @Post('verify-code')
  async verifyCode(
    @Body('email') email: string,
    @Body('code') code: string
  ) {
    return this.auth.verifyCode(email, code);
  }

  @Post('complete-profile')
  async completeProfile(
    @Body('email') email: string,
    @Body('username') username: string,
    @Body('password') password: string
  ) {
    return this.auth.completeProfile(email, username, password);
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('remember') remember: boolean,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.auth.login(email, password, !!remember, res);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    return this.auth.logout(res);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.auth.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string
  ) {
    return this.auth.resetPassword(token, newPassword);
  }

  @Get('status')
  async status(@Req() req: Request) {
    return this.auth.status(req);
  }

  // Stub สำหรับปุ่ม Google login ในหน้า frontend
  @Get('google')
  async googleStub(@Res() res: Response) {
    // ตอนนี้ยังไม่ได้ทำ OAuth จริง ให้ redirect กลับหน้า login พร้อม query param
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5500';
    res.redirect(`${frontend}/login.html?google=not_implemented`);
  }
}
