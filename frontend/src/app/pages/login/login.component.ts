import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  remember = false;
  showPw = false;
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
    try {
      const r = await this.api.request<{ ok: boolean; role?: string }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: {
            email: this.email.trim(),
            password: this.password,
            remember: this.remember,
          },
        },
      );
      if (r.role === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/home']);
      }
    } catch (e: any) {
      this.msg = e.message || 'Login failed';
    }
  }

  async loginWithGoogle() {
    const base =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://projectangular1.onrender.com';
    window.location.href = `${base}/api/auth/google`;
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }
  }
}
