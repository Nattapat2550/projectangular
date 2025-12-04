import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Req,
  BadRequestException
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly auth: AuthService
  ) {}

  @Get('users')
  async list(@Req() req: Request) {
    await this.auth.requireAdmin(req);
    return this.admin.listUsers();
  }

  @Put('users/:id')
  async update(
    @Req() req: Request,
    @Param('id') idStr: string,
    @Body('role') role: string
  ) {
    await this.auth.requireAdmin(req);
    const id = parseInt(idStr, 10);
    if (!id) throw new BadRequestException('Invalid id');
    return this.admin.updateUser(id, role);
  }

  @Delete('users/:id')
  async delete(
    @Req() req: Request,
    @Param('id') idStr: string
  ) {
    await this.auth.requireAdmin(req);
    const id = parseInt(idStr, 10);
    if (!id) throw new BadRequestException('Invalid id');
    return this.admin.deleteUser(id);
  }
}
