import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [RouterLink, FormsModule, NgIf],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  username = '';
  email = '';
  avatarUrl = 'assets/user.png';

  newUsername = '';
  msg = '';
  resetMsg = '';
  loading = false;

  constructor(private api: ApiService, private router: Router) {}

  async ngOnInit() {
    this.applyStoredTheme();
    await this.loadMe();
  }

  toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem(
      'theme',
      document.body.classList.contains('dark') ? 'dark' : 'light',
    );
  }

  async logout() {
    try {
      await this.api.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    this.router.navigate(['/']);
  }

  private async loadMe() {
    try {
      const me = await this.api.request<{
        id: number;
        username: string;
        email: string;
        role: string;
        profile_picture_url: string;
      }>('/api/auth/me', { method: 'GET' });
      this.username = me.username || me.email;
      this.email = me.email;
      this.avatarUrl = me.profile_picture_url || this.avatarUrl;
      this.newUsername = this.username;
    } catch (e: any) {
      this.msg = e.message || 'Failed to load user';
      this.router.navigate(['/login']);
    }
  }

  async saveProfile() {
    this.msg = '';
    this.loading = true;
    try {
      const updated = await this.api.request<{
        id: number;
        username: string;
        email: string;
        role: string;
        profile_picture_url: string;
      }>('/api/auth/me', {
        method: 'PUT',
        body: { username: this.newUsername.trim() },
      });
      this.username = updated.username || updated.email;
      this.avatarUrl = updated.profile_picture_url || this.avatarUrl;
      this.msg = 'Profile updated';
    } catch (e: any) {
      this.msg = e.message || 'Failed to update profile';
    } finally {
      this.loading = false;
    }
  }

  async sendResetLink() {
    this.resetMsg = '';
    if (!this.email) {
      this.resetMsg = 'No email';
      return;
    }
    try {
      await this.api.request('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: this.email },
      });
      this.resetMsg = 'ถ้ามีอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์ reset ไปแล้ว';
    } catch (e: any) {
      this.resetMsg = e.message || 'Failed to send reset link';
    }
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }
  }
}
