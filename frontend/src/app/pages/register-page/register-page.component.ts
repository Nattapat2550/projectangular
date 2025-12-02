// src/app/pages/register-page/register-page.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css'],
})
export class RegisterPageComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const { name, email, password } = this.form.value;

    this.authService.register(name, email, password).subscribe({
      next: () => {
        console.log('Register success');
        alert('Register success, please login');
        // TODO: redirect ไปหน้า login
      },
      error: (err) => {
        console.error('Register error', err);
        alert('Register failed');
      },
    });
  }
}
