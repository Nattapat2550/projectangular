import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  remember = false;
  showPw = false;
  msg = '';

  readonly googleUrl = `${environment.apiBaseUrl}/api/auth/google`;

  constructor(private auth: AuthService) {}

  async submit() {
    this.msg = '';
    try {
      const me = await this.auth.login(this.email.trim(), this.password, this.remember);
      if (me.role === 'admin') {
        location.href = '/admin.html';
      } else {
        location.href = '/home.html';
      }
    } catch (e: any) {
      this.msg = e.message || 'Login failed';
    }
  }
}
