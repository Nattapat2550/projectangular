
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);
  data: any;
  ngOnInit(){ this.api.adminData().subscribe(d => this.data = d); }
}
