import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Body,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly auth: AuthService
  ) {}

  @Get('me')
  async me(@Req() req: Request) {
    const user = await this.auth.requireUser(req);
    return this.users.getById(user.id);
  }

  @Put('me')
  async updateMe(
    @Req() req: Request,
    @Body('username') username: string
  ) {
    if (!username || username.trim().length < 2) {
      throw new BadRequestException('Invalid username');
    }
    const user = await this.auth.requireUser(req);
    return this.users.updateUsername(user.id, username.trim());
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile() file: any
  ) {
    const user = await this.auth.requireUser(req);
    if (!file) {
      throw new BadRequestException('Missing file');
    }
    const mime = file.mimetype || 'image/png';
    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${mime};base64,${base64}`;
    return this.users.updateAvatar(user.id, dataUrl);
  }

  @Delete('me')
  async deleteMe(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.requireUser(req);
    await this.users.deleteMe(user.id);
    res.clearCookie('token');
    return { ok: true };
  }
}
