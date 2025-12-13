import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CarouselService } from '../carousel/carousel.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { AdminGuard } from '../common/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly users: UsersService,
    private readonly carousel: CarouselService,
  ) {}

  @Get('users')
  async getUsers() {
    return this.users.getAllUsers();
  }

  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body('username') username?: string,
    @Body('email') email?: string,
    @Body('role') role?: string,
    @Body('profile_picture_url') profilePictureUrl?: string,
  ) {
    // แก้ไข: เรียก adminUpdateUser ใน service แทนการ query ตรงๆ
    return this.users.adminUpdateUser(Number(id), {
      username,
      email,
      role,
      profile_picture_url: profilePictureUrl,
    });
  }

  // ... (ส่วน Carousel ไม่ต้องแก้ เพราะเรียก service อยู่แล้ว) ...
  @Get('carousel')
  async listCarousel() {
    return this.carousel.listCarouselItems();
  }

  @Post('carousel')
  async createCarousel(
    @Body('item_index') itemIndex: number,
    @Body('title') title?: string,
    @Body('subtitle') subtitle?: string,
    @Body('description') description?: string,
    @Body('image_dataurl') imageDataUrl?: string,
  ) {
    return this.carousel.createCarouselItem({
      itemIndex,
      title,
      subtitle,
      description,
      imageDataUrl,
    });
  }

  @Put('carousel/:id')
  async updateCarousel(
    @Param('id') id: string,
    @Body('item_index') itemIndex?: number,
    @Body('title') title?: string,
    @Body('subtitle') subtitle?: string,
    @Body('description') description?: string,
    @Body('image_dataurl') imageDataUrl?: string,
  ) {
    return this.carousel.updateCarouselItem(Number(id), {
      itemIndex,
      title,
      subtitle,
      description,
      imageDataUrl,
    });
  }

  @Delete('carousel/:id')
  async deleteCarousel(@Param('id') id: string) {
    await this.carousel.deleteCarouselItem(Number(id));
    return { ok: true };
  }
}