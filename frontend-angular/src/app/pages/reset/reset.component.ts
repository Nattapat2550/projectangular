import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';


@Component({
standalone: true,
selector: 'app-reset',
imports: [FormsModule],
templateUrl: './reset.component.html'
})
export class ResetComponent {
email=''; token=''; password='';
constructor(private api: ApiService) {}
request(){ this.api.post('/api/auth/request-reset', { email: this.email }).subscribe(); }
submit(){ this.api.post('/api/auth/reset-password', { token: this.token, password: this.password }).subscribe(); }
}