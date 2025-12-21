import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-check',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './check.component.html',
})
export class CheckComponent implements OnInit {
  email = '';
  code = '';
  loading = false;
  msg = '';

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.applyStoredTheme();

    // docker behavior: email is stored in sessionStorage
    const stored = sessionStorage.getItem('pendingEmail') || '';
    const qp = this.route.snapshot.queryParamMap.get('email') || '';
    this.email = qp || stored;
    if (this.email) sessionStorage.setItem('pendingEmail', this.email);
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
      const email = (this.email || '').trim();
      if (!email) throw new Error('Missing email. Please register again.');

      await this.api.request('/api/auth/verify-code', {
        method: 'POST',
        body: { email, code: this.code.trim() },
      });

      // move to profile form
      this.router.navigate(['/form']);
    } catch (e: any) {
      this.msg = e?.message || 'Invalid code';
    } finally {
      this.loading = false;
    }
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark');
  }
}
