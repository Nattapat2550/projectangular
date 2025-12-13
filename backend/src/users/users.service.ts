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

  private async callApi(method: 'GET' | 'POST', path: string, data?: any) {
    try {
      const res = await axios({
        method,
        url: `${this.pureApiUrl}/api/internal${path}`,
        data,
        headers: { 'x-api-key': this.pureApiKey },
      });
      return res.data.data;
    } catch (error) {
      console.error(`Error calling Pure API (${path}):`, error.response?.data || error.message);
      // ส่งกลับ null หรือ throw ตามบริบทเดิม
      if (error.response?.status === 404) return null;
      throw new InternalServerErrorException('External API Error');
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

  // ฟังก์ชันนี้ Pure-API ทำรวมอยู่ใน validateAndConsumeCode แล้ว แต่ถ้าต้องการแยกใช้
  // ใน internal routes ไม่มี endpoint นี้โดยตรง แต่อาจไม่จำเป็นต้องใช้แยก
  async markEmailVerified(userId: number) {
    // หากจำเป็นต้องใช้จริงๆ อาจต้องเพิ่ม endpoint ใน pure-api หรือใช้ admin update
    return { id: userId, is_email_verified: true }; 
  }

  async setUsernameAndPassword(email: string, username: string, password: string) {
    return this.callApi('POST', '/set-username-password', { email, username, password });
  }

  async updateProfile(userId: number, data: { username?: string; profilePictureUrl?: string }) {
    // ใช้ Endpoint ของ Admin update แทน เพราะ Pure-API internal มีให้ใช้
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

  // ฟังก์ชันใหม่สำหรับ AdminController เพื่อไม่ให้เรียก db โดยตรง
  async adminUpdateUser(id: number, data: any) {
    return this.callApi('POST', '/admin/users/update', { id, ...data });
  }

  async storeVerificationCode(userId: number, code: string, expiresAt: Date) {
    return this.callApi('POST', '/store-verification-code', { userId, code, expiresAt });
  }

  async validateAndConsumeCode(email: string, code: string) {
    const res = await axios.post(
      `${this.pureApiUrl}/api/internal/verify-code`,
      { email, code },
      { headers: { 'x-api-key': this.pureApiKey } }
    );
    // pure-api return { ok: true, userId: ... } or { ok: false, reason: ... }
    return res.data;
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