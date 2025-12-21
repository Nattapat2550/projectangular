import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  showPw = false;
  remember = false;

  loading = false;
  msg = '';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.applyStoredTheme();
  }

  toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem(
      'theme',
      document.body.classList.contains('dark') ? 'dark' : 'light',
    );
  }

  async onSubmit() {
    this.msg = '';
    this.loading = true;
    try {
      const r: any = await this.api.request('/api/auth/login', {
        method: 'POST',
        body: {
          email: this.email.trim(),
          password: this.password,
          remember: !!this.remember,
        },
      });

      // optional Bearer fallback token (some environments block cookies)
      if (r?.token) localStorage.setItem('token', String(r.token));

      // role-based redirect (docker behavior)
      const role = String(r?.role || 'user').toLowerCase();
      this.router.navigate([role === 'admin' ? '/admin' : '/home']);
    } catch (e: any) {
      this.msg = e?.message || 'Login failed';
    } finally {
      this.loading = false;
    }
  }

  loginWithGoogle() {
    window.location.href = `${this.api.apiBase}/auth/google`;
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark');
  }
}
