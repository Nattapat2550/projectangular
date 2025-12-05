import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NgIf } from '@angular/common';

type ResetMode = 'request' | 'reset';

@Component({
  standalone: true,
  selector: 'app-reset',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './reset.component.html',
})
export class ResetComponent implements OnInit {
  mode: ResetMode = 'request';
  email = '';
  token = '';
  newPassword = '';
  confirmPassword = '';
  msg = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.applyStoredTheme();
    this.route.queryParamMap.subscribe((params) => {
      const t = params.get('token');
      if (t) {
        this.mode = 'reset';
        this.token = t;
      } else {
        this.mode = 'request';
      }
    });
  }

  toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem(
      'theme',
      document.body.classList.contains('dark') ? 'dark' : 'light',
    );
  }

  async sendResetLink() {
    this.msg = '';
    if (!this.email.trim()) {
      this.msg = 'Please enter email';
      return;
    }
    this.loading = true;
    try {
      await this.api.request('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: this.email.trim() },
      });
      this.msg = 'ถ้ามีอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์ reset ไปแล้ว';
    } catch (e: any) {
      this.msg = e.message || 'Failed to send reset link';
    } finally {
      this.loading = false;
    }
  }

  async resetPassword() {
    this.msg = '';
    if (this.newPassword !== this.confirmPassword) {
      this.msg = 'Password does not match';
      return;
    }
    if (!this.token) {
      this.msg = 'Missing token';
      return;
    }
    this.loading = true;
    try {
      await this.api.request('/api/auth/reset-password', {
        method: 'POST',
        body: {
          token: this.token,
          newPassword: this.newPassword,
        },
      });
      this.msg = 'Password changed successfully. Redirecting to login...';
      setTimeout(() => this.router.navigate(['/login']), 1500);
    } catch (e: any) {
      this.msg = e.message || 'Failed to reset password';
    } finally {
      this.loading = false;
    }
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }
  }
}
