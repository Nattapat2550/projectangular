import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class UsersService {
  private pureApiUrl: string;
  private pureApiKey: string;

  constructor(private readonly config: ConfigService) {
    this.pureApiUrl = this.config.get<string>('PURE_API_BASE_URL');
    this.pureApiKey = this.config.get<string>('PURE_API_KEY');
  }

  // Helper สำหรับยิง Request ไปยัง Pure API
  private async callApi(method: 'GET' | 'POST', path: string, data?: any) {
    try {
      const res = await axios({
        method,
        url: `${this.pureApiUrl}/api/internal${path}`,
        data,
        headers: { 'x-api-key': this.pureApiKey },
      });
      return res.data.data;
    } catch (error: any) {
      console.error(`Error calling Pure API (${path}):`, error.response?.data || error.message);
      return null;
    }
  }

  // --- ฟังก์ชันที่ AdminController เรียกใช้ (ที่เป็นต้นเหตุของ Error) ---
  async adminUpdateUser(id: number, data: any) {
    return this.callApi('POST', '/admin/users/update', { id, ...data });
  }
  // -----------------------------------------------------------

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

  async markEmailVerified(userId: number) {
    // Pure API จัดการเรื่องนี้ให้ตอน verify code แล้ว
    // ฟังก์ชันนี้คืนค่า User ปัจจุบันกลับไปเพื่อให้ flow เดิมทำงานต่อได้
    return this.findUserById(userId);
  }

  async setUsernameAndPassword(email: string, username: string, password: string) {
    return this.callApi('POST', '/set-username-password', { email, username, password });
  }

  async updateProfile(userId: number, data: { username?: string; profilePictureUrl?: string }) {
    return this.callApi('POST', '/admin/users/update', {
      id: userId,
      username: data.username,
      profile_picture_url: data.profilePictureUrl
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
      const res = await axios.post(
        `${this.pureApiUrl}/api/internal/verify-code`,
        { email, code },
        { headers: { 'x-api-key': this.pureApiKey } }
      );
      return res.data;
    } catch (error) {
      return { ok: false, reason: 'error' };
    }
  }

  async setOAuthUser(args: {
    email: string;
    provider: string;
    oauthId: string;
    pictureUrl?: string;
    name?: string;
  }) {
    return this.callApi('POST', '/set-oauth-user', args);
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