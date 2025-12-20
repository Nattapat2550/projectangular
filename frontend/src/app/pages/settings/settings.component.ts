import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  username = '';
  avatarUrl = 'assets/user.png';

  newUsername = '';
  msg = '';
  busy = false;

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

  async loadMe() {
    try {
      const me = await this.api.request<any>('/api/users/me');
      this.username = me.username || me.email || '';
      this.newUsername = me.username || '';
      this.avatarUrl = me.profile_picture_url || 'assets/user.png';
    } catch (e: any) {
      this.msg = e.message || 'Please login';
      this.router.navigate(['/']);
    }
  }

  async saveUsername() {
    this.msg = '';
    this.busy = true;
    try {
      const r = await this.api.request<any>('/api/users/me', {
        method: 'PUT',
        body: { username: this.newUsername.trim() },
      });
      this.username = r.username || this.newUsername.trim() || this.username;
      this.msg = 'Saved';
    } catch (e: any) {
      this.msg = e.message || 'Failed';
    } finally {
      this.busy = false;
    }
  }

  async onAvatarSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.msg = 'Please select an image file.';
      input.value = '';
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      this.msg = 'Image too large (max 4MB).';
      input.value = '';
      return;
    }

    const fd = new FormData();
    fd.append('avatar', file);

    this.msg = '';
    this.busy = true;

    try {
      const r = await this.api.request<any>('/api/users/me/avatar', {
        method: 'POST',
        body: fd,
      });
      this.avatarUrl = r.profile_picture_url || this.avatarUrl;
      this.msg = 'Avatar updated';
    } catch (e: any) {
      this.msg = e.message || 'Upload failed';
    } finally {
      this.busy = false;
    }
  }

  async deleteAccount() {
    if (!confirm('Delete your account? This cannot be undone.')) return;

    this.msg = '';
    this.busy = true;
    try {
      await this.api.request('/api/users/me', { method: 'DELETE' });
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_role');
      this.router.navigate(['/']);
    } catch (e: any) {
      this.msg = e.message || 'Delete failed';
    } finally {
      this.busy = false;
    }
  }

  async logout() {
    try {
      await this.api.request('/api/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_role');
      this.router.navigate(['/']);
    }
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }
  }
}
