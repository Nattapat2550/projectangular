
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private api = inject(ApiService);
  email = ''; name = ''; password = '';
  async submit(){
    await this.api.register({ email:this.email, name:this.name, password:this.password }).toPromise();
    alert('Registered. Please login.');
  }
}
