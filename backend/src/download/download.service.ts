import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DownloadService {
  constructor(private config: ConfigService) {}

  getDownloadUrl(type: 'android' | 'windows') {
    const pureApiUrl = this.config.get<string>('PURE_API_BASE_URL');
    // สมมติว่า Pure API มี route /api/download/android หรือ /windows
    // คุณอาจต้องเช็ค pure-api routes ว่า path จริงคืออะไร
    return `${pureApiUrl}/api/download/${type}`;
  }
}