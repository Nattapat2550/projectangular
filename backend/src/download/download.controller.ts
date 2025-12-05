import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('download')
export class DownloadController {
  private safeDownload(res: Response, filePath: string, filename: string) {
    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (err) {
        console.error('download error', err);
        return res.status(404).json({ error: 'File not found' });
      }
      return res.download(filePath, filename);
    });
  }

  @Get('windows')
  async downloadWindows(@Res() res: Response) {
    const filePath = path.join(process.cwd(), 'app', 'MyAppSetup.exe');
    this.safeDownload(res, filePath, 'MyAppSetup.exe');
  }

  @Get('android')
  async downloadAndroid(@Res() res: Response) {
    const filePath = path.join(process.cwd(), 'app', 'app-release.apk');
    this.safeDownload(res, filePath, 'app-release.apk');
  }
}
