import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-download',
  imports: [RouterLink],
  templateUrl: './download.component.html',
})
export class DownloadComponent implements OnInit {
  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.applyStoredTheme();
  }

  toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem(
      'theme',
      document.body.classList.contains('dark') ? 'dark' : 'light',
    );
  }

  downloadWindows() {
    window.location.href = `${this.api.apiBase}/download/windows`;
  }

  downloadAndroid() {
    window.location.href = `${this.api.apiBase}/download/android`;
  }

  private applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }
  }
}
