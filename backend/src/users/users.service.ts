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
      // กรณี 404 หรือหาไม่เจอ ให้ return null เพื่อให้ AuthService จัดการต่อ (เช่น return 401)
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

  async setOAuthUser(args: {
    email: string;
    provider: string;
    oauthId: string;
    pictureUrl?: string;
    name?: string;
  }) {
    return this.callApi('POST', '/set-oauth-user', args);
  }

  async setUsernameAndPassword(email: string, username: string, password: string) {
    return this.callApi('POST', '/set-username-password', { email, username, password });
  }

  // ใช้สำหรับหน้า Admin
  async adminUpdateUser(id: number, data: any) {
    return this.callApi('POST', '/admin/users/update', { id, ...data });
  }

  // ใช้สำหรับ User ทั่วไปแก้ไขโปรไฟล์ตัวเอง
  async updateProfile(userId: number, data: { username?: string; profilePictureUrl?: string }) {
    // ใช้ endpoint เดียวกับ admin update ได้ เพราะ pure-api internal อนุญาตให้แก้ได้
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
      // Pure API return { ok: true/false, ... } ตรงๆ
      return res.data;
    } catch (error) {
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