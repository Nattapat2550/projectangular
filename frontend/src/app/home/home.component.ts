import { Component, OnInit } from '@angular/core';
import { AuthService, Me } from '../auth.service';
import { ApiService } from '../api.service';

interface CarouselItem {
  id: number;
  item_index: number;
  title: string;
  subtitle: string;
  description: string;
  image_dataurl: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  me: Me | null = null;
  welcomeHeader = '';
  mainParagraph = '';
  slides: CarouselItem[] = [];
  activeIndex = 0;

  constructor(private auth: AuthService, private api: ApiService) {}

  async ngOnInit() {
    this.me = (await this.auth.loadStatus()) as Me;

    const content = await this.api.request<any[]>('/api/homepage', { method: 'GET' });
    const map = Object.fromEntries(content.map((c) => [c.section_name, c.content]));
    this.welcomeHeader =
      map.welcome_header || `Welcome, ${this.me?.username || this.me?.email}`;
    this.mainParagraph = map.main_paragraph || 'This is your dashboard.';

    const items = await this.api.request<CarouselItem[]>('/api/carousel', { method: 'GET' });
    this.slides =
      Array.isArray(items) && items.length > 0
        ? items
        : [
            {
              id: 0,
              item_index: 0,
              title: 'No slides yet',
              subtitle: '',
              description: '',
              image_dataurl: 'images/user.png',
            },
          ];
  }

  setActive(i: number) {
    this.activeIndex = i;
  }

  prev() {
    if (!this.slides.length) return;
    this.activeIndex = (this.activeIndex - 1 + this.slides.length) % this.slides.length;
  }

  next() {
    if (!this.slides.length) return;
    this.activeIndex = (this.activeIndex + 1) % this.slides.length;
  }
}
