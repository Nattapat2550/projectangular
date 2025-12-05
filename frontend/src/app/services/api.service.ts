import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // ให้ตรงกับ backend URL บน Render
  private readonly API_BASE_URL =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : 'https://projectangular1.onrender.com';

  constructor(private http: HttpClient) {}

  async request<T>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
    } = {},
  ): Promise<T> {
    const method = options.method || 'GET';
    const url = this.API_BASE_URL + path;

    try {
      const obs =
        method === 'GET'
          ? this.http.get<T>(url, { withCredentials: true })
          : method === 'POST'
          ? this.http.post<T>(url, options.body || {}, { withCredentials: true })
          : method === 'PUT'
          ? this.http.put<T>(url, options.body || {}, { withCredentials: true })
          : this.http.delete<T>(url, { withCredentials: true });

      const data = await firstValueFrom(obs);
      return data;
    } catch (e: any) {
      const msg = e?.error?.error || e?.error?.message || e?.message || 'Request failed';
      throw new Error(msg);
    }
  }

  // helper status
  async getAuthStatus() {
    return this.request<{ authenticated: boolean; id?: number; role?: string }>(
      '/api/auth/status',
      { method: 'GET' },
    );
  }
}
