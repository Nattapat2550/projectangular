import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NgIf, NgForOf } from '@angular/common';

interface UserRow {
  id: number;
  username: string;
  email: string;
  role: string;
  profile_picture_url?: string;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;

  editUsername: string;
  editRole: string;
}

interface CarouselItem {
  id: number;
  item_index: number;
  title: string;
  subtitle: string;
  description: string;
  image_dataurl: string;

  editIndex: number;
  editTitle: string;
  editSubtitle: string;
  editDescription: string;
}

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [RouterLink, FormsModule, NgIf, NgForOf],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  username = '';
  avatarUrl = 'assets/user.png';
  msg = '';

  users: UserRow[] = [];
  carouselItems: CarouselItem[] = [];
  sections: { [key: string]: string } = {};

  newCarousel = {
    item_index: 0,
    title: '',
    subtitle: '',
    description: '',
    image_dataurl: '',
  };

  loading = false;

  constructor(private api: ApiService, private router: Router) {}

  async ngOnInit() {
    this.applyStoredTheme();
    await this.ensureAdmin();
    await this.loadAll();
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

  private async ensureAdmin() {
    try {
      const me = await this.api.request<{
        id: number;
        username: string;
        email: string;
        role: string;
        profile_picture_url: string;
      }>('/api/auth/me', { method: 'GET' });
      if (me.role !== 'admin') {
        this.router.navigate(['/home']);
        return;
      }
      this.username = me.username || me.email;
      this.avatarUrl = me.profile_picture_url || this.avatarUrl;
    } catch {
      this.router.navigate(['/login']);
    }
  }

  private async loadAll() {
    await Promise.all([this.loadUsers(), this.loadCarousel(), this.loadHomepage()]);
  }

  private async loadUsers() {
    try {
      const rows = await this.api.request<any[]>('/api/admin/users', {
        method: 'GET',
      });
      this.users = rows.map((u) => ({
        ...u,
        editUsername: u.username,
        editRole: u.role,
      }));
    } catch (e: any) {
      this.msg = e.message || 'Failed to load users';
    }
  }

  private async loadCarousel() {
    try {
      const rows = await this.api.request<any[]>('/api/admin/carousel', {
        method: 'GET',
      });
      this.carouselItems = rows.map((c) => ({
        ...c,
        editIndex: c.item_index,
        editTitle: c.title,
        editSubtitle: c.subtitle,
        editDescription: c.description,
      }));
    } catch {
      // ignore
    }
  }

  private async loadHomepage() {
    try {
      const rows = await this.api.request<
        { section_name: string; content: string }[]
      >('/api/homepage', { method: 'GET' });
      const map: { [k: string]: string } = {};
      rows.forEach((r) => (map[r.section_name] = r.content));
      this.sections = map;
      if (!this.sections['welcome_header']) this.sections['welcome_header'] = '';
      if (!this.sections['main_paragraph']) this.sections['main_paragraph'] = '';
    } catch {
      // ignore
    }
  }

  async saveUser(user: UserRow) {
    this.msg = '';
    try {
      const updated = await this.api.request<any>(
        `/api/admin/users/${user.id}`,
        {
          method: 'PUT',
          body: {
            username: user.editUsername.trim(),
            email: user.email,
            role: user.editRole.trim(),
            profile_picture_url: user.profile_picture_url,
          },
        },
      );
      user.username = updated.username;
      user.role = updated.role;
      user.editUsername = updated.username;
      user.editRole = updated.role;
      this.msg = 'User updated';
    } catch (e: any) {
      this.msg = e.message || 'Failed to update user';
    }
  }

  async saveSection(key: string) {
    this.msg = '';
    try {
      await this.api.request('/api/homepage', {
        method: 'PUT',
        body: {
          section_name: key,
          content: this.sections[key] || '',
        },
      });
      this.msg = `Section "${key}" saved`;
    } catch (e: any) {
      this.msg = e.message || 'Failed to save section';
    }
  }

  async createCarouselItem() {
    this.msg = '';
    try {
      const created = await this.api.request<any>('/api/admin/carousel', {
        method: 'POST',
        body: {
          item_index: this.newCarousel.item_index,
          title: this.newCarousel.title,
          subtitle: this.newCarousel.subtitle,
          description: this.newCarousel.description,
          image_dataurl: this.newCarousel.image_dataurl || null,
        },
      });
      this.carouselItems.push({
        ...created,
        editIndex: created.item_index,
        editTitle: created.title,
        editSubtitle: created.subtitle,
        editDescription: created.description,
      });
      this.newCarousel = {
        item_index: 0,
        title: '',
        subtitle: '',
        description: '',
        image_dataurl: '',
      };
      this.msg = 'Carousel item created';
    } catch (e: any) {
      this.msg = e.message || 'Failed to create carousel item';
    }
  }

  async saveCarouselItem(item: CarouselItem) {
    this.msg = '';
    try {
      const updated = await this.api.request<any>(
        `/api/admin/carousel/${item.id}`,
        {
          method: 'PUT',
          body: {
            item_index: item.editIndex,
            title: item.editTitle,
            subtitle: item.editSubtitle,
            description: item.editDescription,
            image_dataurl: item.image_dataurl,
          },
        },
      );
      item.item_index = updated.item_index;
      item.title = updated.title;
      item.subtitle = updated.subtitle;
      item.description = updated.description;
      item.editIndex = updated.item_index;
      item.editTitle = updated.title;
      item.editSubtitle = updated.subtitle;
      item.editDescription = updated.description;
      this.msg = 'Carousel item updated';
    } catch (e: any) {
      this.msg = e.message || 'Failed to update carousel item';
    }
  }

  async deleteCarouselItem(item: CarouselItem) {
    this.msg = '';
    try {
      await this.api.request(`/api/admin/carousel/${item.id}`, {
        method: 'DELETE',
      });
      this.carouselItems = this.carouselItems.filter((c) => c.id !== item.id);
      this.msg = 'Carousel item deleted';
    } catch (e: any) {
      this.msg = e.message || 'Failed to delete carousel item';
    }
  }

  onNewImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.newCarousel.image_dataurl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onEditImageSelected(item: CarouselItem, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      item.image_dataurl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }
  }
}
