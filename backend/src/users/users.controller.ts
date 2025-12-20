import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  private clearAuthCookie(res: Response) {
    const isProd =
      process.env.NODE_ENV === 'production' || !!process.env.RENDER_EXTERNAL_URL;
    const sameSite = isProd ? 'none' : 'lax';

    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: sameSite as 'none' | 'lax',
      path: '/',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    const u = await this.users.findUserById(user.id);
    if (!u) throw new BadRequestException('Not found');

    return {
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      profile_picture_url: u.profile_picture_url,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(
    @CurrentUser() user: any,
    @Body('username') username?: string,
  ) {
    const u = await this.users.updateProfile(user.id, { username });

    return {
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      profile_picture_url: u.profile_picture_url,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 4 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: any,
    // ✅ ไม่ใช้ Express namespace เพื่อกัน TS2503
    @UploadedFile() file?: any,
  ) {
    if (!file) throw new BadRequestException('No file');
    if (!file.mimetype || !String(file.mimetype).startsWith('image/')) {
      throw new BadRequestException('Invalid file');
    }

    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${b64}`;

    const u = await this.users.updateProfile(user.id, {
      profilePictureUrl: dataUrl,
    });

    return {
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      profile_picture_url: u.profile_picture_url,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteMe(@CurrentUser() user: any, @Res() res: Response) {
    await this.users.deleteUser(user.id);

    this.clearAuthCookie(res);

    return res.json({ ok: true });
  }
}
