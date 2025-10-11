
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html'
})
export class AboutComponent implements OnInit {
  auth = inject(AuthService);
  api = inject(ApiService);

  ngOnInit(): void {
    // keep empty to not change existing behavior
  }
}
