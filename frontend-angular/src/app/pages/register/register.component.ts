import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';


@Component({
standalone: true,
selector: 'app-register',
imports: [FormsModule],
templateUrl: './register.component.html'
})
export class RegisterComponent {
email=''; password=''; name='';
constructor(private api: ApiService) {}
submit(){ this.api.post('/api/auth/register', {email:this.email,password:this.password,name:this.name}).subscribe(); }
}