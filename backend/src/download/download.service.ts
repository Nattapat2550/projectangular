import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable() // ต้องมี decorator นี้
export class DownloadService {
  constructor(private config: ConfigService) {}

  getDownloadUrl(type: 'android' | 'windows') {
    const pureApiUrl = this.config.get<string>('PURE_API_BASE_URL');
    return `${pureApiUrl}/api/download/${type}`;
  }
}