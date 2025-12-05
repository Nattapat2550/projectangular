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
    const { rows } = await (this.users as any).db.query(
      `UPDATE users SET
         username = COALESCE($2, username),
         email = COALESCE($3, email),
         role = COALESCE($4, role),
         profile_picture_url = COALESCE($5, profile_picture_url)
       WHERE id=$1
       RETURNING id, username, email, role, profile_picture_url, is_email_verified, created_at, updated_at`,
      [id, username || null, email || null, role || null, profilePictureUrl || null],
    );
    const row = rows[0];
    if (!row) return { error: 'Not found' };
    return row;
  }

  // Carousel admin endpoints
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
