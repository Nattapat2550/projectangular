import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-check',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './check.component.html',
})
export class CheckComponent implements OnInit {
  email = '';
  code = '';
  msg = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.applyStoredTheme();
    this.route.queryParamMap.subscribe((params) => {
      this.email = params.get('email') || '';
    });
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
      await this.api.request('/api/auth/verify-code', {
        method: 'POST',
        body: { email: this.email.trim(), code: this.code.trim() },
      });
      this.router.navigate(['/form'], {
        queryParams: { email: this.email.trim() },
      });
    } catch (e: any) {
      this.msg = e.message || 'Invalid code';
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
