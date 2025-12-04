import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-check',
  templateUrl: './check.component.html',
})
export class CheckComponent implements OnInit {
  email = '';
  code = '';
  msg = '';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    const email = sessionStorage.getItem('pending_email');
    if (!email) {
      this.router.navigateByUrl('/register.html');
      return;
    }
    this.email = email;
  }

  async submit() {
    this.msg = '';
    if (!this.code.trim()) {
      this.msg = 'Please enter verification code';
      return;
    }
    try {
      await this.api.request('/api/auth/verify-code', {
        method: 'POST',
        body: { email: this.email, code: this.code.trim() },
      });
      this.router.navigateByUrl('/form.html');
    } catch (e: any) {
      this.msg = e.message || 'Verification failed';
    }
  }
}
