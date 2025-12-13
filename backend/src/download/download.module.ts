import { Module } from '@nestjs/common';
import { DownloadController } from './download.controller';
import { DownloadService } from './download.service'; // 1. import เข้ามา

@Module({
  controllers: [DownloadController],
  providers: [DownloadService], // 2. เพิ่มใส่ providers
})
export class DownloadModule {}