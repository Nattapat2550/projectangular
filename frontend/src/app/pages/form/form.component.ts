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
  confirmPassword = '';
  showPw = false;
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
    if (!this.email) {
      this.msg = 'Missing email param';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.msg = 'Password does not match';
      return;
    }
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
      this.router.navigate(['/home']);
    } catch (e: any) {
      this.msg = e.message || 'Failed to complete profile';
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
