// src/app/pages/login-page/login-page.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        console.log('Login success', res);
        // TODO: redirect หลังล็อกอินสำเร็จ เช่น:
        // this.router.navigate(['/']);
      },
      error: (err: unknown) => {
        console.error('Login error', err);
      },
    });
  }

  loginWithGoogle(): void {
    // ปรับ URL ให้ตรง backend ของคุณ
    window.location.href = 'https://YOUR_BACKEND_URL/auth/google';
  }
}
