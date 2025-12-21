import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-form',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './form.component.html',
})
export class FormComponent implements OnInit {
  email = '';
  username = '';
  password = '';

  loading = false;
  msg = '';

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.applyStoredTheme();

    const stored = sessionStorage.getItem('pendingEmail') || '';
    const qp = this.route.snapshot.queryParamMap.get('email') || '';
    this.email = qp || stored || '';
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
    this.loading = true;
    try {
      const email = this.email.trim();
      if (!email) throw new Error('Missing email. Please register again.');

      const r: any = await this.api.request('/api/auth/complete-profile', {
        method: 'POST',
        body: {
          email,
          username: this.username.trim(),
          password: this.password,
        },
      });

      // optional Bearer fallback token
      if (r?.token) localStorage.setItem('token', String(r.token));

      // clear pending
      sessionStorage.removeItem('pendingEmail');

      const role = String(r?.role || 'user').toLowerCase();
      this.router.navigate([role === 'admin' ? '/admin' : '/home']);
    } catch (e: any) {
      this.msg = e?.message || 'Failed';
    } finally {
      this.loading = false;
    }
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark');
  }
}
