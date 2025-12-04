import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';

interface AdminUser {
  id: number;
  email: string;
  username?: string;
  role: string;
  is_email_verified: boolean;
  profile_picture_url?: string;
  created_at?: string;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  users: AdminUser[] = [];
  msg = '';

  constructor(private api: ApiService) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    this.msg = '';
    try {
      this.users = await this.api.request<AdminUser[]>('/api/admin/users', {
        method: 'GET',
      });
    } catch (e: any) {
      this.msg = e.message || 'Load users failed';
    }
  }

  async changeRole(user: AdminUser, role: string) {
    this.msg = '';
    try {
      await this.api.request(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        body: { role },
      });
      user.role = role;
    } catch (e: any) {
      this.msg = e.message || 'Update role failed';
    }
  }

  async deleteUser(user: AdminUser) {
    if (!confirm(`Delete user ${user.email}?`)) return;
    this.msg = '';
    try {
      await this.api.request(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });
      this.users = this.users.filter((u) => u.id !== user.id);
    } catch (e: any) {
      this.msg = e.message || 'Delete user failed';
    }
  }
}
