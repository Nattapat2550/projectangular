import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root app shell:
 * - Applies stored theme on load
 * - Captures #token=... from OAuth redirect (same as docker frontend)
 * - Handles user-menu dropdown toggle-close behavior (same as docker frontend)
 */
@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
    this.applyStoredTheme();
    this.captureTokenFromHash();
  }

  // Close user menu when clicking outside (docker behavior)
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const menu = document.getElementById('userMenu');
    if (!menu) return;

    const target = e.target as any;
    if (menu.contains(target)) {
      menu.classList.toggle('open');
    } else {
      menu.classList.remove('open');
    }
  }

  private captureTokenFromHash() {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#')) return;

    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token);
      // remove hash to keep URL clean
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark');
  }
}
