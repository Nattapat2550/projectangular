import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}

  async listUsers() {
    const { rows } = await this.db.query(
      `SELECT id, email, username, role, is_email_verified, profile_picture_url, created_at
       FROM users
       ORDER BY id ASC`
    );
    return rows;
  }

  async updateUser(id: number, role?: string) {
    const { rows } = await this.db.query(
      'UPDATE users SET role = COALESCE($2, role) WHERE id=$1 RETURNING id, email, username, role, is_email_verified, profile_picture_url, created_at',
      [id, role || null]
    );
    return rows[0];
  }

  async deleteUser(id: number) {
    await this.db.query('DELETE FROM users WHERE id=$1', [id]);
    return { ok: true };
  }
}
