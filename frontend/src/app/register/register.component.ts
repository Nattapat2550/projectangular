import { Component } from '@angular/core';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  email = '';
  msg = '';

  constructor(private api: ApiService, private router: Router) {}

  async submit() {
    this.msg = '';
    const email = this.email.trim();
    if (!email) {
      this.msg = 'Please enter email';
      return;
    }
    try {
      await this.api.request('/api/auth/register', {
        method: 'POST',
        body: { email },
      });
      sessionStorage.setItem('pending_email', email);
      this.router.navigateByUrl('/check.html');
    } catch (e: any) {
      this.msg = e.message || 'Register failed';
    }
  }
}
