import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';


@Injectable({ providedIn: 'root' })
export class AuthService {
private meCache: any = null;
constructor(private api: ApiService) {}


async fetchMe() {
try {
const me = await firstValueFrom(this.api.get<any>('/api/users/me'));
this.meCache = me;
return me;
} catch { return null; }
}


login(body: any) { return this.api.post('/api/auth/login', body); }
register(body: any) { return this.api.post('/api/auth/register', body); }
logout() { return this.api.post('/api/auth/logout', {}); }
}