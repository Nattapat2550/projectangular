import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CarouselService {
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

  async listCarouselItems() {
    const data = await this.callPureApi('/carousel/list', 'GET');
    return data || [];
  }

  async createCarouselItem(args: any) {
    return this.callPureApi('/carousel/create', 'POST', args);
  }

  async updateCarouselItem(id: number, args: any) {
    return this.callPureApi('/carousel/update', 'POST', { id, ...args });
  }

  async deleteCarouselItem(id: number) {
    await this.callPureApi('/carousel/delete', 'POST', { id });
  }
}