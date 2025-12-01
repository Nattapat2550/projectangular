import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value;

    // TODO: แก้ URL ให้ตรง backend ของเรา
    this.http.post('/api/auth/login', { email, password }).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => console.error(err),
    });
  }

  loginWithGoogle() {
    // TODO: แก้ URL ให้ตรง backend ของเรา
    window.location.href = '/api/auth/google';
  }
}
