import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';

type Role = 'user' | 'admin';

interface UserRow {
  id: number;
  username: string | null;
  email: string;
  role: Role;
}

interface CarouselItem {
  id: number;
  item_index: number;
  image_dataurl: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [RouterLink, FormsModule, NgIf, NgForOf],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  username = 'Admin';
  avatarUrl = 'assets/user.png';

  msg = '';

  // Homepage section editor
  section = 'welcome_header';
  content = '';
  loadingHome = false;

  users: UserRow[] = [];
  savingUserId: number | null = null;

  carousel: CarouselItem[] = [];
  savingCarouselId: number | null = null;
  deletingCarouselId: number | null = null;

  // New slide form
  newSlide: {
    item_index: number;
    title: string;
    subtitle: string;
    description: string;
  } = {
    item_index: 0,
    title: '',
    subtitle: '',
    description: '',
  };
  private newSlideFile: File | null = null;
  loadingAdd = false;

  // Per-row uploaded files
  private rowFiles: Record<number, File | null> = {};

  constructor(private api: ApiService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.applyStoredTheme();
    await this.load();
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
    } catch {}
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }

  private async load() {
    this.msg = '';
    try {
      const me: any = await this.api.request('/api/users/me', { method: 'GET' });

      const role = String(me.role || '').toLowerCase();
      if (role !== 'admin') {
        this.router.navigate(['/home']);
        return;
      }

      this.username = me.username || me.email || 'Admin';
      this.avatarUrl = me.profile_picture_url || 'assets/user.png';

      await Promise.all([this.loadUsers(), this.loadCarousel()]);
    } catch (e: any) {
      this.router.navigate(['/']);
    }
  }

  async loadUsers() {
    try {
      const users = await this.api.request<UserRow[]>('/api/admin/users', { method: 'GET' });
      this.users = (users || []).map(u => ({
        ...u,
        role: (String((u as any).role || 'user').toLowerCase() as Role),
      }));
    } catch (e: any) {
      this.msg = e?.message || 'Failed to load users';
    }
  }

  async saveUser(u: UserRow) {
    this.msg = '';
    this.savingUserId = u.id;
    try {
      await this.api.request(`/api/admin/users/${u.id}`, {
        method: 'PUT',
        body: {
          username: u.username ?? '',
          email: u.email ?? '',
          role: u.role,
        },
      });
      this.msg = 'Saved';
    } catch (e: any) {
      this.msg = e?.message || 'Save failed';
    } finally {
      this.savingUserId = null;
    }
  }

  async saveHomepageSection() {
    this.msg = '';
    this.loadingHome = true;
    try {
      await this.api.request('/api/homepage', {
        method: 'PUT',
        body: { section_name: this.section.trim(), content: this.content },
      });
      this.msg = `Section "${this.section.trim()}" saved.`;
    } catch (e: any) {
      this.msg = e?.message || 'Homepage save failed';
    } finally {
      this.loadingHome = false;
    }
  }

  async loadCarousel() {
    try {
      const items = await this.api.request<CarouselItem[]>('/api/admin/carousel', { method: 'GET' });
      this.carousel = (items || []).slice().sort((a, b) => (a.item_index ?? 0) - (b.item_index ?? 0));
      this.rowFiles = {};
    } catch (e: any) {
      this.msg = e?.message || 'Failed to load carousel';
    }
  }

  onNewSlideFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.newSlideFile = file;
  }

  onCarouselFile(id: number, ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.rowFiles[id] = file;
  }

  async addSlide() {
    this.msg = '';
    if (!this.newSlideFile) {
      this.msg = 'Please choose an image.';
      return;
    }
    this.loadingAdd = true;

    try {
      const imageDataUrl = await this.readAsDataUrl(this.newSlideFile);

      await this.api.request('/api/admin/carousel', {
        method: 'POST',
        body: {
          item_index: Number(this.newSlide.item_index ?? 0),
          title: this.newSlide.title || '',
          subtitle: this.newSlide.subtitle || '',
          description: this.newSlide.description || '',
          image_dataurl: imageDataUrl,
        },
      });

      this.msg = 'Slide added.';
      this.newSlide = { item_index: 0, title: '', subtitle: '', description: '' };
      this.newSlideFile = null;
      await this.loadCarousel();
    } catch (e: any) {
      this.msg = e?.message || 'Create failed';
    } finally {
      this.loadingAdd = false;
    }
  }

  async saveCarousel(it: CarouselItem) {
    this.msg = '';
    this.savingCarouselId = it.id;

    try {
      let imageDataUrl: string | undefined = undefined;
      const file = this.rowFiles[it.id];
      if (file) {
        imageDataUrl = await this.readAsDataUrl(file);
      }

      const body: any = {
        item_index: Number(it.item_index ?? 0),
        title: it.title || '',
        subtitle: it.subtitle || '',
        description: it.description || '',
      };
      if (imageDataUrl) body.image_dataurl = imageDataUrl;

      await this.api.request(`/api/admin/carousel/${it.id}`, {
        method: 'PUT',
        body,
      });

      this.msg = 'Saved.';
      await this.loadCarousel();
    } catch (e: any) {
      this.msg = e?.message || 'Save failed';
    } finally {
      this.savingCarouselId = null;
    }
  }

  async deleteCarousel(id: number) {
    this.msg = '';
    if (!confirm('Delete this slide?')) return;

    this.deletingCarouselId = id;
    try {
      await this.api.request(`/api/admin/carousel/${id}`, { method: 'DELETE' });
      this.msg = 'Deleted.';
      await this.loadCarousel();
    } catch (e: any) {
      this.msg = e?.message || 'Delete failed';
    } finally {
      this.deletingCarouselId = null;
    }
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) return reject(new Error('Invalid image file'));

      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(new Error('Failed to read image'));
      r.readAsDataURL(file);
    });
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark');
  }
}
