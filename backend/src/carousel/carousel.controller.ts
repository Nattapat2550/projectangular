import { Controller, Get } from '@nestjs/common';
import { CarouselService } from './carousel.service';

@Controller('carousel')
export class CarouselController {
  constructor(private readonly service: CarouselService) {}

  @Get()
  async list() {
    return this.service.listCarouselItems();
  }
}