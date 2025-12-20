import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';

interface UserRow {
  id: number;
  email: string;
  username: string | null;
  role: 'user' | 'admin';
}

interface CarouselItem {
  id: number;
  item_index: number;
  title: string;
  subtitle: string;
  description: string;
  image_dataurl?: string;
  // client-side only
  _file?: File | null;
}

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [RouterLink, FormsModule, NgIf, NgForOf],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  username = '...';
  avatarUrl = 'assets/user.png';
  msg = '';

  users: UserRow[] = [];

  carousel: CarouselItem[] = [];
  newItem: Partial<CarouselItem> & { _file?: File | null } = {
    title: '',
    subtitle: '',
    description: '',
    _file: null,
  };

  welcomeHeader = '';
  mainParagraph = '';

  constructor(private api: ApiService, private router: Router) {}

  async ngOnInit() {
    this.applyStoredTheme();
    await this.loadMe();

    await Promise.all([this.loadUsers(), this.loadHomepage(), this.loadCarousel()]);
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
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_role');
      this.router.navigate(['/']);
    }
  }

  private async loadMe() {
    try {
      const me = await this.api.request<any>('/api/auth/me');
      this.username = me.username || me.email || 'Admin';
      this.avatarUrl = me.profile_picture_url || 'assets/user.png';
      localStorage.setItem('auth_role', me.role || 'admin');
    } catch {
      this.router.navigate(['/']);
    }
  }

  async loadUsers() {
    try {
      this.users = await this.api.request<UserRow[]>('/api/admin/users');
    } catch (e: any) {
      this.msg = e.message || 'Failed to load users';
    }
  }

  async saveUser(u: UserRow) {
    this.msg = '';
    try {
      await this.api.request(`/api/admin/users/${u.id}`, {
        method: 'PUT',
        body: { username: u.username, role: u.role },
      });
      this.msg = 'User saved';
    } catch (e: any) {
      this.msg = e.message || 'Failed to save user';
    }
  }

  async loadHomepage() {
    try {
      const sections = await this.api.request<
        { section_key: string; section_value: string }[]
      >('/api/homepage');

      const map = new Map(sections.map((s) => [s.section_key, s.section_value]));
      this.welcomeHeader = map.get('welcome_header') || '';
      this.mainParagraph = map.get('main_paragraph') || '';
    } catch (e: any) {
      this.msg = e.message || 'Failed to load homepage';
    }
  }

  async saveHomepage() {
    this.msg = '';
    try {
      await this.api.request('/api/homepage', {
        method: 'PUT',
        body: { section_key: 'welcome_header', section_value: this.welcomeHeader },
      });
      await this.api.request('/api/homepage', {
        method: 'PUT',
        body: { section_key: 'main_paragraph', section_value: this.mainParagraph },
      });
      this.msg = 'Homepage saved';
    } catch (e: any) {
      this.msg = e.message || 'Failed to save homepage';
    }
  }

  async loadCarousel() {
    try {
      const items = await this.api.request<CarouselItem[]>('/api/admin/carousel');
      this.carousel = (items || []).sort((a, b) => a.item_index - b.item_index);
    } catch (e: any) {
      this.msg = e.message || 'Failed to load carousel';
    }
  }

  onFile(evt: Event, item: CarouselItem) {
    const input = evt.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    item._file = input.files[0];
  }

  onNewFile(evt: Event) {
    const input = evt.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    this.newItem._file = input.files[0];
  }

  private async fileToDataUrl(file: File): Promise<string> {
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(new Error('Failed to read file'));
      r.readAsDataURL(file);
    });
  }

  async saveCarousel(item: CarouselItem) {
    this.msg = '';
    try {
      let image_dataurl = item.image_dataurl;
      if (item._file) {
        image_dataurl = await this.fileToDataUrl(item._file);
      }

      await this.api.request(`/api/admin/carousel/${item.id}`, {
        method: 'PUT',
        body: {
          item_index: item.item_index,
          title: item.title,
          subtitle: item.subtitle,
          description: item.description,
          image_dataurl,
        },
      });

      item._file = null;
      await this.loadCarousel();
      this.msg = 'Carousel saved';
    } catch (e: any) {
      this.msg = e.message || 'Failed to save carousel';
    }
  }

  async deleteCarousel(item: CarouselItem) {
    if (!confirm('Delete this item?')) return;

    this.msg = '';
    try {
      await this.api.request(`/api/admin/carousel/${item.id}`, { method: 'DELETE' });
      await this.loadCarousel();
      this.msg = 'Carousel deleted';
    } catch (e: any) {
      this.msg = e.message || 'Failed to delete carousel';
    }
  }

  async addCarousel() {
    this.msg = '';

    try {
      const nextIndex =
        this.carousel.length ? Math.max(...this.carousel.map((x) => x.item_index)) + 1 : 0;

      let image_dataurl: string | undefined = undefined;
      if (this.newItem._file) {
        image_dataurl = await this.fileToDataUrl(this.newItem._file);
      }

      await this.api.request('/api/admin/carousel', {
        method: 'POST',
        body: {
          item_index: nextIndex,
          title: this.newItem.title || '',
          subtitle: this.newItem.subtitle || '',
          description: this.newItem.description || '',
          image_dataurl,
        },
      });

      this.newItem = { title: '', subtitle: '', description: '', _file: null };
      await this.loadCarousel();
      this.msg = 'Carousel item added';
    } catch (e: any) {
      this.msg = e.message || 'Failed to add carousel';
    }
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark');
  }
}
