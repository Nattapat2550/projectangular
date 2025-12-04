import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-form',
  templateUrl: './profile-form.component.html',
})
export class ProfileFormComponent implements OnInit {
  email = '';
  username = '';
  password = '';
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
    if (!this.username.trim() || !this.password) {
      this.msg = 'Please fill all fields';
      return;
    }
    try {
      await this.api.request('/api/auth/complete-profile', {
        method: 'POST',
        body: {
          email: this.email,
          username: this.username.trim(),
          password: this.password,
        },
      });
      this.router.navigateByUrl('/login.html');
    } catch (e: any) {
      this.msg = e.message || 'Save profile failed';
    }
  }
}
