// src/app/pages/login-page/login-page.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const { email, password } = this.form.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        console.log('Login success');
        // TODO: redirect ไปหน้า home/admin ตามต้องการ
      },
      error: (err) => {
        console.error('Login error', err);
        alert('Login failed');
      },
    });
  }

  loginWithGoogle(): void {
    // เปลี่ยน URL ให้เป็น backend ของคุณบน Render
    window.location.href = 'https://projectangular1.onrender.com/auth/google';
  }
}
