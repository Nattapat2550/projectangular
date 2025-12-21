import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-reset',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './reset.component.html',
})
export class ResetComponent implements OnInit {
  email = '';
  token = '';
  newPassword = '';

  loading = false;
  msg = '';

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.applyStoredTheme();
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem(
      'theme',
      document.body.classList.contains('dark') ? 'dark' : 'light',
    );
  }

  async requestReset() {
    this.msg = '';
    this.loading = true;
    try {
      await this.api.request('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: this.email.trim() },
      });
      this.msg = 'If your email exists, a reset link was sent.';
    } catch (e: any) {
      this.msg = e?.message || 'Request failed';
    } finally {
      this.loading = false;
    }
  }

  async doReset() {
    this.msg = '';
    this.loading = true;
    try {
      await this.api.request('/api/auth/reset-password', {
        method: 'POST',
        body: { token: this.token, newPassword: this.newPassword },
      });
      this.msg = 'Password reset successfully. Please login.';
      // small UX: go to login after reset
      setTimeout(() => this.router.navigate(['/login']), 400);
    } catch (e: any) {
      this.msg = e?.message || 'Reset failed';
    } finally {
      this.loading = false;
    }
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark');
  }
}
