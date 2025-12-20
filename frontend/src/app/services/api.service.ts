import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

@Injectable({ providedIn: 'root' })
export class ApiService {
  /**
   * Backend origin (no trailing slash), e.g. http://localhost:5000 or https://your-backend.onrender.com
   * - Dev: localhost:5000
   * - Prod: default to projectangular1.onrender.com (override via window.__API_ORIGIN__ if you want)
   */
  readonly origin: string;

  constructor(private http: HttpClient) {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    const override = (window as any).__API_ORIGIN__ as string | undefined;
    const prodDefault = 'https://projectangular1.onrender.com';

    this.origin = (isLocal ? 'http://localhost:5000' : (override || prodDefault)).replace(/\/$/, '');
  }

  get apiBase(): string {
    return this.origin + '/api';
  }

  private buildHeaders(extra?: Record<string, string>, body?: any): HttpHeaders {
    let headers = new HttpHeaders(extra || {});

    // ✅ Support token-in-hash fallback (mobile / 3rd-party cookie blocked)
    const token = localStorage.getItem('auth_token');
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);

    // Only set JSON content-type when body is plain object (NOT FormData)
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      if (!headers.has('Content-Type')) headers = headers.set('Content-Type', 'application/json');
    }

    return headers;
  }

  async request<T>(
    path: string,
    options: {
      method?: HttpMethod;
      body?: any;
      headers?: Record<string, string>;
    } = {},
  ): Promise<T> {
    const method = options.method || 'GET';
    const url = this.origin + path;

    const headers = this.buildHeaders(options.headers, options.body);

    try {
      const obs =
        method === 'GET'
          ? this.http.get<T>(url, { withCredentials: true, headers })
          : method === 'POST'
          ? this.http.post<T>(url, options.body ?? {}, { withCredentials: true, headers })
          : method === 'PUT'
          ? this.http.put<T>(url, options.body ?? {}, { withCredentials: true, headers })
          : this.http.delete<T>(url, { withCredentials: true, headers });

      return await firstValueFrom(obs);
    } catch (e: any) {
      const msg =
        e?.error?.error ||
        e?.error?.message ||
        e?.message ||
        'Request failed';
      throw new Error(msg);
    }
  }

  async getAuthStatus() {
    return this.request<{ authenticated: boolean; id?: number; role?: string }>(
      '/api/auth/status',
      { method: 'GET' },
    );
  }
}
