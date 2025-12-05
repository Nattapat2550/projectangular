import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit {
  email = '';
  msg = '';
  loading = false;

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
    this.loading = true;
    try {
      await this.api.request('/api/auth/register', {
        method: 'POST',
        body: { email: this.email.trim() },
      });
      this.router.navigate(['/check'], {
        queryParams: { email: this.email.trim() },
      });
    } catch (e: any) {
      this.msg = e.message || 'Register failed';
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
