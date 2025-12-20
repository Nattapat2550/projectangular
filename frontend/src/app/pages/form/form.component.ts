import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NgIf } from '@angular/common';

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
  showPw = false;
  msg = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    this.applyStoredTheme();
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    if (!this.email) {
      this.router.navigate(['/']);
    }
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
      await this.api.request('/api/auth/complete-profile', {
        method: 'POST',
        body: {
          email: this.email.trim(),
          username: this.username.trim(),
          password: this.password,
        },
      });

      // cookie set by backend
      this.router.navigate(['/home']);
    } catch (e: any) {
      this.msg = e.message || 'Failed';
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
