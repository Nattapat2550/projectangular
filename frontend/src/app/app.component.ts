// frontend/src/app/app.component.ts
import { Component, AfterViewInit, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

function parseHashParams(hash: string): Record<string, string> {
  const out: Record<string, string> = {};
  const h = (hash || '').replace(/^#/, '');
  if (!h) return out;

  for (const part of h.split('&')) {
    const [k, v] = part.split('=');
    if (!k) continue;
    out[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return out;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, AfterViewInit {
  ngOnInit(): void {
    // ✅ Theme persistence (same behavior as docker frontend)
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark');

    // ✅ Token-in-hash fallback (used by some OAuth redirects / mobile)
    // Example: #token=...&role=admin
    const params = parseHashParams(window.location.hash);
    if (params['token']) {
      localStorage.setItem('auth_token', params['token']);
      if (params['role']) localStorage.setItem('auth_role', params['role']);

      // Remove token from URL for safety
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  ngAfterViewInit(): void {
    // close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      const menu = document.getElementById('userMenu');
      if (!menu) return;

      const target = event.target as Node | null;
      if (!target) return;

      const inside = menu.contains(target);

      if (inside) {
        // click inside → toggle open
        menu.classList.toggle('open');
      } else {
        // click outside → close
        menu.classList.remove('open');
      }
    });
  }
}
