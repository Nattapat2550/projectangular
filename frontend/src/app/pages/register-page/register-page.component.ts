// src/app/pages/register-page/register-page.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.form.value;

    this.authService.register(name, email, password).subscribe({
      next: (res) => {
        console.log('Register success', res);
        // TODO: redirect เช่น ไปหน้า login
        // this.router.navigate(['/login']);
      },
      error: (err: unknown) => {
        console.error('Register error', err);
      },
    });
  }
}
