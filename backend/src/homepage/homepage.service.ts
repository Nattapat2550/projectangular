import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class HomepageService {
  private pureApiUrl: string;
  private pureApiKey: string;

  constructor(private readonly config: ConfigService) {
    this.pureApiUrl = this.config.get<string>('PURE_API_BASE_URL');
    this.pureApiKey = this.config.get<string>('PURE_API_KEY');
  }

  async getHomepageContent() {
    const res = await axios.get(`${this.pureApiUrl}/api/internal/homepage/list`, {
      headers: { 'x-api-key': this.pureApiKey },
    });
    return res.data.data;
  }

  async upsertSection(sectionName: string, content: string) {
    const res = await axios.post(
      `${this.pureApiUrl}/api/internal/homepage/update`,
      { section_name: sectionName, content },
      { headers: { 'x-api-key': this.pureApiKey } }
    );
    return res.data.data;
  }
}