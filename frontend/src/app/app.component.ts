import { Component, OnInit } from '@angular/core';
import { AuthService, Me } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  me: Me | null | undefined = undefined;

  constructor(private auth: AuthService) {}

  async ngOnInit() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }
    this.me = await this.auth.loadStatus();
  }

  async logout() {
    await this.auth.logout();
    this.me = null;
    location.href = '/index.html';
  }

  toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem(
      'theme',
      document.body.classList.contains('dark') ? 'dark' : 'light',
    );
  }
}
