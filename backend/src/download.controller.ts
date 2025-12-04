import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';

@Controller('api/download')
export class DownloadController {
  @Get('windows')
  async windows(@Res() res: Response) {
    const filePath = path.join(__dirname, '..', 'app', 'MyAppSetup.exe');
    res.download(filePath, 'MyAppSetup.exe');
  }

  @Get('android')
  async android(@Res() res: Response) {
    const filePath = path.join(__dirname, '..', 'app', 'app-release.apk');
    res.download(filePath, 'app-release.apk');
  }
}
