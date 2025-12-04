import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  async request<T>(
    path: string,
    options: { method?: 'GET'|'POST'|'PUT'|'DELETE'; body?: any } = {},
  ): Promise<T> {
    const method = options.method ?? 'GET';
    const url = `${this.base}${path}`;

    const headers = options.body
      ? new HttpHeaders({ 'Content-Type': 'application/json' })
      : undefined;

    try {
      const obs =
        method === 'GET'
          ? this.http.get<T>(url, { withCredentials: true })
          : method === 'POST'
          ? this.http.post<T>(url, options.body ?? {}, { headers, withCredentials: true })
          : method === 'PUT'
          ? this.http.put<T>(url, options.body ?? {}, { headers, withCredentials: true })
          : this.http.delete<T>(url, { withCredentials: true });

      return await firstValueFrom(obs);
    } catch (e) {
      const err = e as HttpErrorResponse;
      let msg = 'Request failed';
      if (err.error && typeof err.error === 'object' && 'error' in err.error) {
        msg = (err.error as any).error || msg;
      }
      throw new Error(msg);
    }
  }
}
