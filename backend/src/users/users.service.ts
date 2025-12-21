import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export type OAuthProvider = 'google';

export interface SetOAuthUserInput {
  email: string;
  provider: OAuthProvider;
  oauthId: string;
  pictureUrl?: string;
  name?: string;
}

@Injectable()
export class UsersService {
  private pureApiUrl: string;
  private pureApiKey: string;

  private readonly TIMEOUT_MS = 25000;
  private readonly RETRIES = 3;
  private readonly BASE_DELAY_MS = 1200;

  constructor(private readonly config: ConfigService) {
    const rawUrl = (this.config.get<string>('PURE_API_BASE_URL') || '').trim();
    const rawKey = (this.config.get<string>('PURE_API_KEY') || '').trim();

    // ✅ normalize URL:
    // - remove trailing slashes
    // - remove trailing "/api" or "/api/"
    let normalized = rawUrl.replace(/\/+$/, '');
    if (normalized.endsWith('/api')) normalized = normalized.slice(0, -4);

    this.pureApiUrl = normalized;
    this.pureApiKey = rawKey;
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private isTransientError(error: any) {
    const status = error?.response?.status;
    if (status === 502 || status === 503 || status === 504) return true;

    const code = (error?.code || '').toString();
    if (
      ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code)
    ) {
      return true;
    }

    const msg = (error?.message || '').toLowerCase();
    if (
      msg.includes('timeout') ||
      msg.includes('socket hang up') ||
      msg.includes('network error') ||
      msg.includes('fetch failed')
    ) {
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

  private async callApi(method: 'GET' | 'POST', path: string, data?: any) {
    this.ensurePureApiConfigured();

    const url = `${this.pureApiUrl}/api/internal${path}`;
    try {
      const res: any = await this.axiosWithRetry({
        method,
        url,
        data,
        headers: { 'x-api-key': this.pureApiKey },
      });

      return res.data?.data ?? null;
    } catch (error: any) {
      const status = error?.response?.status;

      // ✅ key mismatch / forbidden
      if (status === 401 || status === 403) {
        throw new ServiceUnavailableException(
          'Pure API authentication failed. Please verify PURE_API_KEY is correct.',
        );
      }

      // ✅ endpoint not found
      if (status === 404) return null;

      // ✅ already a clean 503 message
      if (error instanceof ServiceUnavailableException) throw error;

      console.error(`Error calling Pure API (${url}):`, error?.response?.data || error?.message);
      return null;
    }
  }

  async createUserByEmail(email: string) {
    return this.callApi('POST', '/create-user-email', { email });
  }

  async findUserByEmail(email: string) {
    return this.callApi('POST', '/find-user', { email });
  }

  async findUserById(id: number) {
    return this.callApi('POST', '/find-user', { id });
  }

  async findUserByOAuth(provider: string, oauthId: string) {
    return this.callApi('POST', '/find-user', { provider, oauthId });
  }

  async setOAuthUser(input: SetOAuthUserInput) {
    return this.callApi('POST', '/set-oauth-user', {
      email: input.email,
      provider: input.provider,
      oauthId: input.oauthId,
      pictureUrl: input.pictureUrl,
      name: input.name,
    });
  }

  async setUsernameAndPassword(email: string, username: string, password: string) {
    return this.callApi('POST', '/set-username-password', { email, username, password });
  }

  async adminUpdateUser(id: number, data: any) {
    return this.callApi('POST', '/admin/users/update', { id, ...data });
  }

  async updateProfile(userId: number, data: { username?: string; profilePictureUrl?: string }) {
    return this.callApi('POST', '/admin/users/update', {
      id: userId,
      username: data.username,
      profile_picture_url: data.profilePictureUrl,
    });
  }

  async deleteUser(userId: number) {
    await this.callApi('POST', '/delete-user', { id: userId });
  }

  async getAllUsers() {
    return this.callApi('GET', '/admin/users');
  }

  async storeVerificationCode(userId: number, code: string, expiresAt: Date) {
    return this.callApi('POST', '/store-verification-code', { userId, code, expiresAt });
  }

  async validateAndConsumeCode(email: string, code: string) {
    this.ensurePureApiConfigured();

    try {
      const res: any = await this.axiosWithRetry({
        method: 'POST',
        url: `${this.pureApiUrl}/api/internal/verify-code`,
        data: { email, code },
        headers: { 'x-api-key': this.pureApiKey },
      });

      return res.data;
    } catch (error: any) {
      if (error instanceof ServiceUnavailableException) throw error;
      return { ok: false, reason: 'error' };
    }
  }

  async createPasswordResetToken(email: string, token: string, expiresAt: Date) {
    return this.callApi('POST', '/create-reset-token', { email, token, expiresAt });
  }

  async consumePasswordResetToken(rawToken: string) {
    return this.callApi('POST', '/consume-reset-token', { token: rawToken });
  }

  async setPassword(userId: number, newPassword: string) {
    return this.callApi('POST', '/set-password', { userId, newPassword });
  }
}
