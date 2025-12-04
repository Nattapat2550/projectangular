import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
})
export class ResetComponent implements OnInit {
  token = '';
  newPassword = '';
  msg = '';
  done = false;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.msg = 'Invalid reset link';
    }
  }

  async submit() {
    if (!this.token) {
      this.msg = 'Invalid reset link';
      return;
    }
    if (!this.newPassword) {
      this.msg = 'Please enter new password';
      return;
    }
    this.msg = '';
    try {
      await this.api.request('/api/auth/reset-password', {
        method: 'POST',
        body: {
          token: this.token,
          newPassword: this.newPassword,
        },
      });
      this.done = true;
      setTimeout(() => this.router.navigateByUrl('/login.html'), 1500);
    } catch (e: any) {
      this.msg = e.message || 'Reset password failed';
    }
  }
}
