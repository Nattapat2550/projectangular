import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class UsersService {
  private pureApiUrl: string;
  private pureApiKey: string;

  // ปรับได้ตามต้องการ
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

        // ถ้าเป็น transient แล้วหมดรอบ retry => ตอบ 503 ให้ frontend (ไม่ใช่ 500)
        if (this.isTransientError(err)) {
          throw new ServiceUnavailableException('Pure API is waking up. Please try again in a moment.');
        }

        // non-transient => โยนต่อให้ logic เดิมด้านล่างจัดการ
        throw err;
      }
    }

    throw lastErr;
  }

  // Helper สำหรับยิง Request ไปยัง Pure API
  private async callApi(method: 'GET' | 'POST', path: string, data?: any) {
    try {
      const res: any = await this.axiosWithRetry({
        method,
        url: `${this.pureApiUrl}/api/internal${path}`,
        data,
        headers: { 'x-api-key': this.pureApiKey },
      });

      return res.data?.data ?? null;
    } catch (error: any) {
      // ถ้าเป็น 404 ให้ return null เพื่อให้ AuthService จัดการ (เช่น 401)
      if (error?.response?.status === 404) return null;

      // ถ้าโดนโยน ServiceUnavailableException แล้ว ให้ปล่อยขึ้นไปเลย
      if (error instanceof ServiceUnavailableException) throw error;

      console.error(`Error calling Pure API (${path}):`, error.response?.data || error.message);
      return null;
    }
  }

  async createUserByEmail(email: string) {
    return this.callApi('POST', '/create-user-email', { email });
  }

  async findUserByEmail(email: string) {
    // Pure API จะ return user object รวมถึง password_hash เพื่อนำไป check ใน AuthService
    return this.callApi('POST', '/find-user', { email });
  }

  async findUserById(id: number) {
    return this.callApi('POST', '/find-user', { id });
  }

  async findUserByOAuth(provider: string, oauthId: string) {
    return this.callApi('POST', '/find-user', { provider, oauthId });
  }

  async setUsernameAndPassword(email: string, username: string, password: string) {
    return this.callApi('POST', '/set-username-password', { email, username, password });
  }

  // ใช้สำหรับหน้า Admin
  async adminUpdateUser(id: number, data: any) {
    return this.callApi('POST', '/admin/users/update', { id, ...data });
  }

  // ใช้สำหรับ User ทั่วไปแก้ไขโปรไฟล์ตัวเอง
  async updateProfile(
    userId: number,
    data: { username?: string; profilePictureUrl?: string },
  ) {
    // ใช้ endpoint เดียวกับ admin update ได้ เพราะ pure-api internal อนุญาตให้แก้ได้
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
    try {
      const res: any = await this.axiosWithRetry({
        method: 'POST',
        url: `${this.pureApiUrl}/api/internal/verify-code`,
        data: { email, code },
        headers: { 'x-api-key': this.pureApiKey },
      });

      // Pure API return { ok: true/false, ... } ตรงๆ
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