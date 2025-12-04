import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface Me {
  id: number;
  email: string;
  username?: string;
  role: 'user' | 'admin';
  profile_picture_url?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _me: Me | null | undefined = undefined; // undefined = ยังไม่โหลด

  constructor(private api: ApiService) {}

  get me(): Me | null | undefined {
    return this._me;
  }

  async loadStatus(): Promise<Me | null> {
    try {
      const status = await this.api.request<any>('/api/auth/status', { method: 'GET' });
      if (!status.authenticated) {
        this._me = null;
        return null;
      }

      // ดึงข้อมูลเต็มจาก /api/users/me
      const me = await this.api.request<Me>('/api/users/me', { method: 'GET' });
      this._me = me;
      return me;
    } catch {
      this._me = null;
      return null;
    }
  }

  async login(email: string, password: string, remember: boolean): Promise<Me> {
    const res = await this.api.request<any>('/api/auth/login', {
      method: 'POST',
      body: { email, password, remember },
    });
    this._me = {
      id: res.id,
      email: res.email,
      username: res.username,
      role: res.role,
      profile_picture_url: res.profile_picture_url,
    };
    return this._me;
  }

  async logout(): Promise<void> {
    try {
      await this.api.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    this._me = null;
  }

  isAdmin(): boolean {
    return !!this._me && this._me.role === 'admin';
  }
}
