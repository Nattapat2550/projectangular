import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';


@Component({
standalone: true,
selector: 'app-login',
imports: [FormsModule],
templateUrl: './login.component.html',
styleUrls: ['./login.component.css']
})
export class LoginComponent {
email = ''; password = '';
constructor(private auth: AuthService, private router: Router) {}
submit() {
this.auth.login({ email: this.email, password: this.password }).subscribe({
next: () => this.router.navigateByUrl('home')
});
}
google() { window.location.href = `${environment.apiBase}/api/auth/google`; }
}