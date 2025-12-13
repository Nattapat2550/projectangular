import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CarouselService {
  private pureApiUrl: string;
  private pureApiKey: string;

  constructor(private readonly config: ConfigService) {
    this.pureApiUrl = this.config.get<string>('PURE_API_BASE_URL');
    this.pureApiKey = this.config.get<string>('PURE_API_KEY');
  }

  private async callApi(method: 'GET' | 'POST', path: string, data?: any) {
    const res = await axios({
      method,
      url: `${this.pureApiUrl}/api/internal/carousel${path}`,
      data,
      headers: { 'x-api-key': this.pureApiKey },
    });
    return res.data.data;
  }

  async listCarouselItems() {
    return this.callApi('GET', '/list');
  }

  async createCarouselItem(args: any) {
    return this.callApi('POST', '/create', args);
  }

  async updateCarouselItem(id: number, args: any) {
    return this.callApi('POST', '/update', { id, ...args });
  }

  async deleteCarouselItem(id: number) {
    await this.callApi('POST', '/delete', { id });
  }
}