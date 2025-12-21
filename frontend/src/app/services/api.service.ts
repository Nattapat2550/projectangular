import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * API client that mirrors docker frontend behavior:
 * - Uses cookies (withCredentials) for primary auth (HttpOnly token cookie)
 * - Also sends Bearer token from localStorage('token') as a fallback (useful when 3rd-party cookies are blocked)
 * - Keeps the same local/prod base-url detection style
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  origin: string;

  constructor(private http: HttpClient) {
    const host = window.location.hostname || '';

    // allow overrides (useful for local dev)
    const w: any = window as any;
    const forced = w.__API_ORIGIN__ || (w.__env__ && w.__env__.API_ORIGIN);

    // mimic docker: treat localhost / LAN / .local as local
    const isLocal =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.endsWith('.local');

    if (forced) {
      this.origin = String(forced).replace(/\/+$/, '');
    } else if (isLocal) {
      this.origin = 'http://localhost:5000';
    } else {
      // Render service (projectangular1)
      this.origin = 'https://projectangular1.onrender.com';
    }
  }

  get apiBase(): string {
    return this.origin + '/api';
  }

  private buildHeaders(extra?: Record<string, string>, body?: any): HttpHeaders {
    const h: Record<string, string> = { ...(extra || {}) };

    // If body is FormData, do NOT set content-type (browser will set boundary)
    const isFormData =
      typeof FormData !== 'undefined' && body instanceof FormData;

    if (!isFormData && !h['Content-Type']) {
      h['Content-Type'] = 'application/json';
    }

    // Fallback Bearer token (same key as docker frontend)
    const t = localStorage.getItem('token');
    if (t && !h['Authorization']) {
      h['Authorization'] = `Bearer ${t}`;
    }

    return new HttpHeaders(h);
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
            ? this.http.post<T>(url, options.body ?? {}, {
                withCredentials: true,
                headers,
              })
            : method === 'PUT'
              ? this.http.put<T>(url, options.body ?? {}, {
                  withCredentials: true,
                  headers,
                })
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
}
