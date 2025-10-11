import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class ApiService {
private base = environment.apiBase;
constructor(private http: HttpClient) {}
get<T>(url: string) { return this.http.get<T>(`${this.base}${url}`); }
post<T>(url: string, body: any) { return this.http.post<T>(`${this.base}${url}`, body); }
put<T>(url: string, body: any) { return this.http.put<T>(`${this.base}${url}`, body); }
delete<T>(url: string) { return this.http.delete<T>(`${this.base}${url}`); }
}