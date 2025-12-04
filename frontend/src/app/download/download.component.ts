import { Component } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-download',
  templateUrl: './download.component.html',
})
export class DownloadComponent {
  backendBase = environment.apiBaseUrl;

  get windowsUrl(): string {
    return `${this.backendBase}/api/download/windows`;
  }

  get androidUrl(): string {
    return `${this.backendBase}/api/download/android`;
  }
}
