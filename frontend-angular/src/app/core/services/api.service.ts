
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  getMe(): Observable<any> { return this.http.get('/api/users/me'); }
  login(payload: any): Observable<any> { return this.http.post('/api/auth/login', payload); }
  register(payload: any): Observable<any> { return this.http.post('/api/auth/register', payload); }
  requestReset(email: string): Observable<any> { return this.http.post('/api/auth/request-reset', { email }); }
  resetPassword(payload: any): Observable<any> { return this.http.post('/api/auth/reset-password', payload); }
  adminData(): Observable<any> { return this.http.get('/api/admin/summary'); }
}
