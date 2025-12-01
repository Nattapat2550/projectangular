// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  accessToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenKey = 'access_token';
  private isAuthSubject = new BehaviorSubject<boolean>(this.hasToken());

  isAuthenticated$ = this.isAuthSubject.asObservable();

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(tap((res) => this.setToken(res.accessToken)));
  }

  register(
    email: string,
    password: string,
    name: string,
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, {
        email,
        password,
        name,
      })
      .pipe(tap((res) => this.setToken(res.accessToken)));
  }

  googleLogin() {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  handleGoogleCallback(token: string) {
    this.setToken(token);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.isAuthSubject.next(false);
  }

  private setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
    this.isAuthSubject.next(true);
  }
}
