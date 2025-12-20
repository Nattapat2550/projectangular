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
      const r = await this.api.request<{ ok: boolean; role?: string; token?: string }>(
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

      // Optional: token fallback (if backend ever returns it)
      if ((r as any)?.token) localStorage.setItem('auth_token', (r as any).token);

      this.router.navigate([r.role === 'admin' ? '/admin' : '/home']);
    } catch (e: any) {
      this.msg = e.message || 'Login failed';
    }
  }

  loginWithGoogle() {
    window.location.href = `${this.api.apiBase}/auth/google`;
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }
  }
}
