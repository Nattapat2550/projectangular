import {
  Controller,
  Get,
  Req,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException
} from '@nestjs/common';
import { CarouselService } from './carousel.service';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class CarouselController {
  constructor(
    private readonly carousel: CarouselService,
    private readonly auth: AuthService
  ) {}

  // public
  @Get('api/carousel')
  async listPublic() {
    return this.carousel.listPublic();
  }

  // admin list
  @Get('api/admin/carousel')
  async listAdmin(@Req() req: Request) {
    await this.auth.requireAdmin(req);
    return this.carousel.listAdmin();
  }

  @Post('api/admin/carousel')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Req() req: Request,
    @Body('item_index') itemIndexStr: string,
    @Body('title') title: string,
    @Body('subtitle') subtitle: string,
    @Body('description') description: string,
    @UploadedFile() file: any
  ) {
    await this.auth.requireAdmin(req);
    const itemIndex = parseInt(itemIndexStr || '0', 10) || 0;

    let dataUrl: string | null = null;
    if (file) {
      const mime = file.mimetype || 'image/png';
      const base64 = file.buffer.toString('base64');
      dataUrl = `data:${mime};base64,${base64}`;
    }

    return this.carousel.create(itemIndex, title, subtitle, description, dataUrl);
  }

  @Put('api/admin/carousel/:id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Req() req: Request,
    @Param('id') idStr: string,
    @Body('item_index') itemIndexStr: string,
    @Body('title') title: string,
    @Body('subtitle') subtitle: string,
    @Body('description') description: string,
    @UploadedFile() file: any
  ) {
    await this.auth.requireAdmin(req);
    const id = parseInt(idStr, 10);
    if (!id) throw new BadRequestException('Invalid id');

    const itemIndex = itemIndexStr ? parseInt(itemIndexStr, 10) : null;

    let dataUrl: string | null | undefined = undefined;
    if (file) {
      const mime = file.mimetype || 'image/png';
      const base64 = file.buffer.toString('base64');
      dataUrl = `data:${mime};base64,${base64}`;
    }

    return this.carousel.update(id, itemIndex, title || null, subtitle || null, description || null, dataUrl);
  }

  @Delete('api/admin/carousel/:id')
  async delete(
    @Req() req: Request,
    @Param('id') idStr: string
  ) {
    await this.auth.requireAdmin(req);
    const id = parseInt(idStr, 10);
    if (!id) throw new BadRequestException('Invalid id');
    return this.carousel.delete(id);
  }
}
