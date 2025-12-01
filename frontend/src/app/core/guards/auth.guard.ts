// frontend/src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('token');
    if (token) {
      return true;
    }
    // ไม่มี token ให้เด้งไปหน้า login
    return this.router.parseUrl('/auth/login');
  }
}
