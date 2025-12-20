import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NgForOf, NgIf } from '@angular/common';

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
export class HomeComponent implements OnInit, OnDestroy {
  username = '...';
  avatarUrl = 'assets/user.png';
  msg = '';

  carouselItems: CarouselItem[] = [];
  currentIndex = 0;

  welcomeHeader = '';
  mainParagraph = '';

  private autoTimer: any = null;

  constructor(private api: ApiService, private router: Router) {}

  async ngOnInit() {
    this.applyStoredTheme();

    await this.loadMe();
    await this.loadHomepage();
    await this.loadCarousel();

    this.startAuto();
  }

  ngOnDestroy(): void {
    this.stopAuto();
  }

  get isAdmin(): boolean {
    return (localStorage.getItem('auth_role') || '').toLowerCase() === 'admin';
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
      // also clear fallback token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_role');
      this.router.navigate(['/']);
    }
  }

  async loadMe() {
    try {
      const me = await this.api.request<any>('/api/auth/me');
      const uname = me.username || me.email || 'User';
      this.username = uname;
      this.avatarUrl = me.profile_picture_url || 'assets/user.png';
      localStorage.setItem('auth_role', me.role || 'user');
    } catch (e: any) {
      this.msg = e.message || 'Please login';
      this.router.navigate(['/']);
    }
  }

  async loadHomepage() {
    try {
      const sections = await this.api.request<
        { section_key: string; section_value: string }[]
      >('/api/homepage');

      const map = new Map(sections.map((s) => [s.section_key, s.section_value]));
      this.welcomeHeader = map.get('welcome_header') || 'Welcome!';
      this.mainParagraph = map.get('main_paragraph') || '';
    } catch (e: any) {
      this.msg = e.message || 'Failed to load homepage';
    }
  }

  async loadCarousel() {
    try {
      const items = await this.api.request<CarouselItem[]>('/api/carousel');
      this.carouselItems = (items || []).sort((a, b) => a.item_index - b.item_index);
      this.currentIndex = 0;
    } catch (e: any) {
      this.msg = e.message || 'Failed to load carousel';
    }
  }

  prev() {
    if (!this.carouselItems.length) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.carouselItems.length) %
      this.carouselItems.length;
  }

  next() {
    if (!this.carouselItems.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.carouselItems.length;
  }

  goTo(i: number) {
    if (!this.carouselItems.length) return;
    this.currentIndex = Math.max(0, Math.min(i, this.carouselItems.length - 1));
  }

  pauseCarousel() {
    this.stopAuto();
  }

  resumeCarousel() {
    this.startAuto();
  }

  private startAuto() {
    this.stopAuto();
    if (this.carouselItems.length <= 1) return;
    this.autoTimer = setInterval(() => this.next(), 4000);
  }

  private stopAuto() {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }
  }
}
