import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, Me } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  title(title: any) {
    throw new Error('Method not implemented.');
  }
  me: Me | null = null;
  userMenuOpen = false;

  constructor(private auth: AuthService, public router: Router) {}

  async ngOnInit() {
    // theme เดิม
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }

    // โหลดสถานะ user เหมือนที่ guard ใช้
    this.me = await this.auth.loadStatus();
  }

  toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem(
      'theme',
      document.body.classList.contains('dark') ? 'dark' : 'light',
    );
  }

  toggleUserMenu() {
    if (!this.me) return;
    this.userMenuOpen = !this.userMenuOpen;
  }

  async logout(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    await this.auth.logout();
    this.me = null;
    this.userMenuOpen = false;

    // กลับหน้า index เหมือนเดิม
    location.href = '/index.html';
  }
}
