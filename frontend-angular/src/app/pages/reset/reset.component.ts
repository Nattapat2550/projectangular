
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset.component.html'
})
export class ResetComponent {
  private api = inject(ApiService);
  email = '';
  token = '';
  newPassword = '';

  request(){
    this.api.requestReset(this.email).subscribe(()=> alert('If the email exists, a reset link was sent.'));
  }
  change(){
    if(!this.token || !this.newPassword){ alert('token and newPassword required'); return; }
    this.api.resetPassword({ token:this.token, password:this.newPassword }).subscribe(()=> alert('Password changed.'));
  }
}
