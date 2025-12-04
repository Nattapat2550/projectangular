import { Controller, Get, Put, Body, Req } from '@nestjs/common';
import { HomepageService } from './homepage.service';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Controller('api/homepage')
export class HomepageController {
  constructor(
    private readonly homepage: HomepageService,
    private readonly auth: AuthService
  ) {}

  @Get()
  async list() {
    return this.homepage.getAll();
  }

  @Put()
  async update(
    @Req() req: Request,
    @Body('section_name') sectionName: string,
    @Body('content') content: string
  ) {
    const user = await this.auth.requireAdmin(req);
    if (!sectionName) {
      throw new Error('Missing section_name');
    }
    return this.homepage.upsert(sectionName, content || '');
  }
}
