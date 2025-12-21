import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit {
  email = '';
  loading = false;
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
    this.loading = true;
    try {
      const email = this.email.trim();
      await this.api.request('/api/auth/register', {
        method: 'POST',
        body: { email },
      });

      // docker behavior
      sessionStorage.setItem('pendingEmail', email);

      this.router.navigate(['/check']);
    } catch (e: any) {
      this.msg = e?.message || 'Register failed';
    } finally {
      this.loading = false;
    }
  }

  signupWithGoogle() {
    window.location.href = `${this.api.apiBase}/auth/google`;
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark');
  }
}
