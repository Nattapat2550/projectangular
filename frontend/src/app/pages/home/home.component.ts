import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgForOf, NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';

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
  selector: 'app-home',
  imports: [RouterLink, NgIf, NgForOf],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  username = 'User';
  avatarUrl = 'assets/user.png';
  isAdmin = false;

  welcomeHeader = '';
  mainParagraph = '';

  carouselItems: CarouselItem[] = [];
  currentIndex = 0;

  private timer: any = null;
  private paused = false;

  constructor(private api: ApiService, private router: Router) {}

  get currentItem(): CarouselItem | null {
    if (!this.carouselItems.length) return null;
    return this.carouselItems[this.currentIndex] || this.carouselItems[0] || null;
  }

  ngOnInit(): void {
    this.applyStoredTheme();
    this.load().catch(() => {});
  }

  ngOnDestroy(): void {
    this.stopAuto();
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
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }

  async load() {
    // user profile (docker uses /api/users/me)
    const me: any = await this.api.request('/api/users/me', { method: 'GET' });
    this.username = me.username || me.email || 'User';
    this.avatarUrl = me.profile_picture_url || 'assets/user.png';
    this.isAdmin = String(me.role || '').toLowerCase() === 'admin';

    // homepage content
    const hp: any = await this.api.request('/api/homepage', { method: 'GET' });
    this.welcomeHeader = hp?.welcome_header || 'Welcome';
    this.mainParagraph =
      hp?.main_paragraph || 'This is your personalized home page.';

    // carousel
    const items: any[] = await this.api.request('/api/carousel', { method: 'GET' });
    this.carouselItems = (items || [])
      .slice()
      .sort((a, b) => (a.item_index ?? 0) - (b.item_index ?? 0));

    this.currentIndex = 0;
    this.startAuto();
  }

  prev() {
    if (this.carouselItems.length <= 1) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.carouselItems.length) %
      this.carouselItems.length;
  }

  next() {
    if (this.carouselItems.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.carouselItems.length;
  }

  goTo(i: number) {
    if (!this.carouselItems.length) return;
    this.currentIndex = Math.max(0, Math.min(i, this.carouselItems.length - 1));
  }

  pauseCarousel() {
    this.paused = true;
  }

  resumeCarousel() {
    this.paused = false;
  }

  private startAuto() {
    this.stopAuto();
    if (this.carouselItems.length <= 1) return;

    this.timer = setInterval(() => {
      if (this.paused) return;
      this.next();
    }, 5000);
  }

  private stopAuto() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark');
  }
}
