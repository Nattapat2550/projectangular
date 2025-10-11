
import { Injectable, Signal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

export interface User { id?: string; email?: string; name?: string; role?: 'user'|'admin'; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);
  user: () => User | null = this._user.asReadonly();

  constructor(private api: ApiService, private router: Router) {
    const cached = localStorage.getItem('user');
    if (cached) this._user.set(JSON.parse(cached));
  }

  isLoggedIn(): boolean { return !!localStorage.getItem('token'); }

  async fetchMe() {
    try {
      const me = await this.api.getMe().toPromise();
      if (me) {
        this._user.set(me);
        localStorage.setItem('user', JSON.stringify(me));
      }
    } catch (e) {
      // token invalid -> clear
      this.logout(false);
    }
  }

  loginWithCredentials = async (email: string, password: string) => {
    const res = await this.api.login({ email, password }).toPromise();
    localStorage.setItem('token', res?.token || '');
    await this.fetchMe();
    this.router.navigateByUrl('/home');
  };

  googleLoginRedirect() {
    window.location.href = '/api/auth/google'; // backend should redirect to Google
  }

  logout(redirect: boolean = true) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._user.set(null);
    if (redirect) this.router.navigateByUrl('/');
  }
}
