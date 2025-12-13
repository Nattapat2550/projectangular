import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { HomepageService } from './homepage.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { AdminGuard } from '../common/admin.guard';

@Controller('homepage')
export class HomepageController {
  constructor(private readonly service: HomepageService) {}

  @Get()
  async getAll() {
    return this.service.getHomepageContent();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put()
  async update(
    @Body('section_name') sectionName: string,
    @Body('content') content: string,
  ) {
    if (!sectionName) {
      return { error: 'Missing section_name' };
    }
    return this.service.upsertSection(sectionName, content || '');
  }
}