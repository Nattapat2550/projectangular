import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class HomepageService {
  private pureApiUrl: string;
  private pureApiKey: string;

  private readonly TIMEOUT_MS = 45000;
  private readonly RETRIES = 5;
  private readonly BASE_DELAY_MS = 1200;

  private lastHealthOkAt = 0;
  private lastHealthFailAt = 0;

  constructor(private readonly config: ConfigService) {
    const rawUrl = (this.config.get<string>('PURE_API_BASE_URL') || '').trim();
    const rawKey = (this.config.get<string>('PURE_API_KEY') || '').trim();
    const nodeEnv = (this.config.get<string>('NODE_ENV') || 'development').trim();

    let normalized = rawUrl.replace(/\/+$/, '');
    if (normalized.endsWith('/api')) normalized = normalized.slice(0, -4);

    this.pureApiUrl = normalized;
    this.pureApiKey = rawKey;

    if (nodeEnv === 'production') {
      this.ensureReady().catch(() => {});
      setInterval(() => this.ensureReady().catch(() => {}), 5 * 60 * 1000);
    }
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private isTransientError(error: any) {
    const status = error?.response?.status;
    if (status === 502 || status === 503 || status === 504) return true;

    const code = String(error?.code || '');
    if (['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code)) {
      return true;
    }

    const msg = String(error?.message || '').toLowerCase();
    return (
      msg.includes('timeout') ||
      msg.includes('socket hang up') ||
      msg.includes('network error') ||
      msg.includes('fetch failed')
    );
  }

  private async axiosWithRetry<T>(cfg: any, attempts = this.RETRIES): Promise<T> {
    let lastErr: any = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const res = await axios({
          timeout: this.TIMEOUT_MS,
          validateStatus: () => true,
          ...cfg,
        });

        if (res.status >= 200 && res.status < 300) return res as any;

        const err: any = new Error(`HTTP ${res.status}`);
        err.response = res;
        throw err;
      } catch (err: any) {
        lastErr = err;

        if (this.isTransientError(err) && attempt < attempts) {
          await this.sleep(this.BASE_DELAY_MS * Math.pow(2, attempt - 1));
          continue;
        }

        if (this.isTransientError(err)) {
          throw new ServiceUnavailableException(
            'Pure API is waking up or temporarily unavailable. Please try again in a moment.',
          );
        }

        throw err;
      }
    }

    throw lastErr;
  }

  private ensurePureApiConfigured() {
    if (!this.pureApiUrl || !this.pureApiKey) {
      throw new ServiceUnavailableException(
        'Pure API is not configured. Please set PURE_API_BASE_URL and PURE_API_KEY in Render environment variables.',
      );
    }
  }

  private async ensureReady(): Promise<void> {
    this.ensurePureApiConfigured();

    const now = Date.now();
    if (now - this.lastHealthOkAt < 30_000) return;

    if (now - this.lastHealthFailAt < 3_000) {
      await this.sleep(500);
    }

    const url = `${this.pureApiUrl}/health`;

    try {
      const res: any = await this.axiosWithRetry({
        method: 'GET',
        url,
        headers: { 'User-Agent': 'projectangular-backend' },
      });

      if (res?.data?.ok === true) {
        this.lastHealthOkAt = Date.now();
        return;
      }

      throw new Error('Pure API health check failed');
    } catch (e: any) {
      this.lastHealthFailAt = Date.now();
      if (e instanceof ServiceUnavailableException) throw e;
      throw new ServiceUnavailableException(
        'Pure API is not reachable right now. Please try again in a moment.',
      );
    }
  }

  private unwrapPureApiResponse(payload: any) {
    if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'data')) {
      return payload.data ?? null;
    }
    return payload ?? null;
  }

  async getHomepageContent() {
    this.ensurePureApiConfigured();
    await this.ensureReady();

    const res: any = await this.axiosWithRetry({
      method: 'GET',
      url: `${this.pureApiUrl}/api/internal/homepage/list`,
      headers: { 'x-api-key': this.pureApiKey },
    });

    return this.unwrapPureApiResponse(res.data);
  }

  async upsertSection(sectionName: string, content: string) {
    this.ensurePureApiConfigured();
    await this.ensureReady();

    const res: any = await this.axiosWithRetry({
      method: 'POST',
      url: `${this.pureApiUrl}/api/internal/homepage/update`,
      data: { section_name: sectionName, content },
      headers: { 'x-api-key': this.pureApiKey },
    });

    return this.unwrapPureApiResponse(res.data);
  }
}
