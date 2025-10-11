import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'; // <— เพิ่ม RouterLinkActive
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet], // <— ใส่ RouterLinkActive ตรงนี้
  template: `
    <nav class="container">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Index</a>
      <a routerLink="/home" routerLinkActive="active">Home</a>
      <a routerLink="/about" routerLinkActive="active">About</a>
      <a routerLink="/contact" routerLinkActive="active">Contact</a>
      <a routerLink="/form" routerLinkActive="active">Form</a>
      <a routerLink="/check" routerLinkActive="active">Check</a>
      <a routerLink="/settings" routerLinkActive="active">Settings</a>
      <a routerLink="/admin" routerLinkActive="active">Admin</a>
      <span style="flex:1"></span>
      <a routerLink="/login" routerLinkActive="active">Login</a>
      <a routerLink="/register" routerLinkActive="active">Register</a>
      <button (click)="logout()">Logout</button>
    </nav>
    <div class="container"><router-outlet/></div>
  `
})
export class AppComponent {
  private auth = inject(AuthService);
  logout(){ this.auth.logout(); }
}
