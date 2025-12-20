import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NgIf } from '@angular/common';

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
  msg = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    this.applyStoredTheme();
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  get isResetMode(): boolean {
    return !!this.token;
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
      this.msg = 'If the email exists, a reset link was sent.';
    } catch (e: any) {
      this.msg = e.message || 'Failed';
    } finally {
      this.loading = false;
    }
  }

  async resetPassword() {
    this.msg = '';
    this.loading = true;
    try {
      await this.api.request('/api/auth/reset-password', {
        method: 'POST',
        body: { token: this.token, newPassword: this.newPassword },
      });
      this.msg = 'Password reset successful. You can login now.';
      // optionally redirect to login after a short delay
      setTimeout(() => this.router.navigate(['/login']), 500);
    } catch (e: any) {
      this.msg = e.message || 'Failed';
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
