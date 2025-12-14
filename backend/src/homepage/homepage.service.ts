import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class HomepageService {
  private pureApiUrl: string;
  private pureApiKey: string;

  private readonly TIMEOUT_MS = 25000;
  private readonly RETRIES = 3;
  private readonly BASE_DELAY_MS = 1200;

  constructor(private readonly config: ConfigService) {
    this.pureApiUrl = this.config.get<string>('PURE_API_BASE_URL') || '';
    this.pureApiKey = this.config.get<string>('PURE_API_KEY') || '';
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private isTransientError(error: any) {
    const status = error?.response?.status;
    if (status === 502 || status === 503 || status === 504) return true;

    const code = (error?.code || '').toString();
    if (['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code)) {
      return true;
    }

    const msg = (error?.message || '').toLowerCase();
    if (msg.includes('timeout') || msg.includes('socket hang up') || msg.includes('network error')) {
      return true;
    }
    return false;
  }

  private async axiosWithRetry<T>(cfg: any, attempts = this.RETRIES): Promise<T> {
    let lastErr: any = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const res = await axios({
          timeout: this.TIMEOUT_MS,
          ...cfg,
        });
        return res as T;
      } catch (err: any) {
        lastErr = err;
        if (this.isTransientError(err) && attempt < attempts) {
          await this.sleep(this.BASE_DELAY_MS * Math.pow(2, attempt - 1));
          continue;
        }
        if (this.isTransientError(err)) {
          throw new ServiceUnavailableException('Pure API is waking up. Please try again in a moment.');
        }
        throw err;
      }
    }

    throw lastErr;
  }

  async getHomepageContent() {
    const res: any = await this.axiosWithRetry({
      method: 'GET',
      url: `${this.pureApiUrl}/api/internal/homepage/list`,
      headers: { 'x-api-key': this.pureApiKey },
    });
    return res.data?.data ?? null;
  }

  async upsertSection(sectionName: string, content: string) {
    const res: any = await this.axiosWithRetry({
      method: 'POST',
      url: `${this.pureApiUrl}/api/internal/homepage/update`,
      data: { section_name: sectionName, content },
      headers: { 'x-api-key': this.pureApiKey },
    });
    return res.data?.data ?? null;
  }
}