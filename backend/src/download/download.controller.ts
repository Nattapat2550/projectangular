import { Controller, Get, Res, Redirect } from '@nestjs/common';
import { DownloadService } from './download.service';

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get('android')
  @Redirect() // ใช้ Redirect ของ NestJS
  downloadAndroid() {
    return { url: this.downloadService.getDownloadUrl('android') };
  }

  @Get('windows')
  @Redirect()
  downloadWindows() {
    return { url: this.downloadService.getDownloadUrl('windows') };
  }
}