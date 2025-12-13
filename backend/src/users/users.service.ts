import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  private pureApiUrl: string;
  private apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.pureApiUrl = this.config.get<string>('PURE_API_BASE_URL');
    this.apiKey = this.config.get<string>('PURE_API_KEY');
  }

  // Helper สำหรับเรียก Pure-API
  private async callPureApi(endpoint: string, method: string = 'POST', body: any = {}) {
    try {
      const res = await fetch(`${this.pureApiUrl}/api/internal${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: method !== 'GET' ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        console.error(`PureAPI Error [${endpoint}]:`, res.status, await res.text());
        return null;
      }
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (e) {
      console.error(`PureAPI Connection Failed [${endpoint}]:`, e);
      return null;
    }
  }

  async createUserByEmail(email: string) {
    return this.callPureApi('/create-user-email', 'POST', { email });
  }

  async findUserByEmail(email: string) {
    return this.callPureApi('/find-user', 'POST', { email });
  }

  async findUserById(id: number) {
    return this.callPureApi('/find-user', 'POST', { id });
  }

  async findUserByOAuth(provider: string, oauthId: string) {
    return this.callPureApi('/find-user', 'POST', { provider, oauthId });
  }

  async markEmailVerified(userId: number) {
    // Pure-API handles this implicitly
    return null;
  }

  async setUsernameAndPassword(email: string, username: string, password: string) {
    return this.callPureApi('/set-username-password', 'POST', { email, username, password });
  }

  async updateProfile(userId: number, data: { username?: string; profilePictureUrl?: string }) {
    return this.callPureApi('/admin/users/update', 'POST', { 
      id: userId, 
      username: data.username, 
      profile_picture_url: data.profilePictureUrl 
    });
  }

  async deleteUser(userId: number) {
    // Implement delete endpoint if needed
  }

  async getAllUsers() {
    const res = await this.callPureApi('/admin/users', 'GET');
    return res || [];
  }

  async storeVerificationCode(userId: number, code: string, expiresAt: Date) {
    return this.callPureApi('/store-verification-code', 'POST', { userId, code, expiresAt });
  }

  async validateAndConsumeCode(email: string, code: string) {
    const result = await this.callPureApi('/verify-code', 'POST', { email, code });
    if (!result || result.ok === false) {
      return { ok: false, reason: result?.reason || 'error' };
    }
    return { ok: true, userId: result.userId || result.data?.userId };
  }

  async setOAuthUser(args: any) {
    return this.callPureApi('/set-oauth-user', 'POST', args);
  }

  async createPasswordResetToken(email: string, token: string, expiresAt: Date) {
    return this.callPureApi('/create-reset-token', 'POST', { email, token, expiresAt });
  }

  async consumePasswordResetToken(rawToken: string) {
    return this.callPureApi('/consume-reset-token', 'POST', { token: rawToken });
  }

  async setPassword(userId: number, newPassword: string) {
    return this.callPureApi('/set-password', 'POST', { userId, newPassword });
  }
}