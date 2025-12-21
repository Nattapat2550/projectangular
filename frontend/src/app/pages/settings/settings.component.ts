import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  username = '';
  msg = '';

  loadingSave = false;
  loadingUpload = false;
  loadingDelete = false;

  private file: File | null = null;

  constructor(private api: ApiService, private router: Router) {}

  async ngOnInit(): Promise<void> {
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
      const me: any = await this.api.request('/api/users/me', { method: 'GET' });
      this.username = me.username || '';
    } catch (e: any) {
      // not logged in
      this.router.navigate(['/']);
    }
  }

  async save() {
    this.msg = '';
    this.loadingSave = true;
    try {
      await this.api.request('/api/auth/me', {
        method: 'PUT',
        body: { username: this.username.trim() },
      });
      this.msg = 'Saved.';
    } catch (e: any) {
      this.msg = e?.message || 'Save failed';
    } finally {
      this.loadingSave = false;
    }
  }

  onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.msg = '';
    if (!file) {
      this.file = null;
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.msg = 'Please select an image file.';
      input.value = '';
      this.file = null;
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      this.msg = 'Image too large (max 4MB).';
      input.value = '';
      this.file = null;
      return;
    }
    this.file = file;
  }

  async uploadAvatar() {
    this.msg = '';
    if (!this.file) {
      this.msg = 'Please choose an image.';
      return;
    }

    this.loadingUpload = true;
    try {
      const fd = new FormData();
      fd.append('avatar', this.file);

      const r: any = await this.api.request('/api/users/me/avatar', {
        method: 'POST',
        body: fd,
      });

      // update token fallback if backend returns one (optional)
      if (r?.token) localStorage.setItem('token', String(r.token));

      this.msg = 'Uploaded.';
      this.file = null;
    } catch (e: any) {
      this.msg = e?.message || 'Upload failed';
    } finally {
      this.loadingUpload = false;
    }
  }

  async deleteAccount() {
    this.msg = '';
    if (!confirm('Delete your account? This cannot be undone.')) return;

    this.loadingDelete = true;
    try {
      await this.api.request('/api/users/me', { method: 'DELETE' });
      localStorage.removeItem('token');
      this.router.navigate(['/']);
    } catch (e: any) {
      this.msg = e?.message || 'Delete failed';
    } finally {
      this.loadingDelete = false;
    }
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark');
  }
}
