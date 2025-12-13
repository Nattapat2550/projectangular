import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HomepageService {
  private pureApiUrl: string;
  private apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.pureApiUrl = this.config.get<string>('PURE_API_BASE_URL');
    this.apiKey = this.config.get<string>('PURE_API_KEY');
  }

  private async callPureApi(endpoint: string, method: string = 'POST', body: any = {}) {
    try {
      const res = await fetch(`${this.pureApiUrl}/api/internal${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey },
        body: method !== 'GET' ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch { return null; }
  }

  async getHomepageContent() {
    const data = await this.callPureApi('/homepage/list', 'GET');
    return data || [];
  }

  async upsertSection(sectionName: string, content: string) {
    return this.callPureApi('/homepage/update', 'POST', { section_name: sectionName, content });
  }
}