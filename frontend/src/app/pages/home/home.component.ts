import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NgIf, NgForOf } from '@angular/common';

interface CarouselItem {
  id: number;
  item_index: number;
  title: string;
  subtitle: string;
  description: string;
  image_dataurl: string;
}

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [RouterLink, NgIf, NgForOf],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  username = '...';
  avatarUrl = 'assets/user.png';
  msg = '';

  carouselItems: CarouselItem[] = [];
  currentIndex = 0;

  welcomeHeader = '';
  mainParagraph = '';

  constructor(private api: ApiService, private router: Router) {}

  async ngOnInit() {
    this.applyStoredTheme();
    await this.loadMe();
    await this.loadHomepage();
    await this.loadCarousel();
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

  get currentItem(): CarouselItem | null {
    return this.carouselItems[this.currentIndex] || null;
  }

  next() {
    if (this.carouselItems.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.carouselItems.length;
  }

  prev() {
    if (this.carouselItems.length === 0) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.carouselItems.length) %
      this.carouselItems.length;
  }

  selectIndex(i: number) {
    this.currentIndex = i;
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
      this.avatarUrl = me.profile_picture_url || this.avatarUrl;
    } catch (e: any) {
      this.msg = e.message || 'Failed to load user';
      this.router.navigate(['/login']);
    }
  }

  private async loadHomepage() {
    try {
      const sections = await this.api.request<
        { section_name: string; content: string }[]
      >('/api/homepage', { method: 'GET' });

      const map = new Map<string, string>();
      sections.forEach((s) => map.set(s.section_name, s.content));
      this.welcomeHeader = map.get('welcome_header') || '';
      this.mainParagraph = map.get('main_paragraph') || '';
    } catch {
      // ignore
    }
  }

  private async loadCarousel() {
    try {
      this.carouselItems = await this.api.request<CarouselItem[]>(
        '/api/carousel',
        { method: 'GET' },
      );
      this.currentIndex = 0;
    } catch {
      // ignore
    }
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }
  }
}
