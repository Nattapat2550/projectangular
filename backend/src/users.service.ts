import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async getById(id: number) {
    const { rows } = await this.db.query(
      'SELECT id, email, username, role, is_email_verified, profile_picture_url FROM users WHERE id=$1',
      [id]
    );
    return rows[0] || null;
  }

  async updateUsername(id: number, username: string) {
    const { rows } = await this.db.query(
      'UPDATE users SET username=$1 WHERE id=$2 RETURNING id, email, username, role, is_email_verified, profile_picture_url',
      [username, id]
    );
    return rows[0];
  }

  async updateAvatar(id: number, dataUrl: string) {
    const { rows } = await this.db.query(
      'UPDATE users SET profile_picture_url=$1 WHERE id=$2 RETURNING id, email, username, role, is_email_verified, profile_picture_url',
      [dataUrl, id]
    );
    return rows[0];
  }

  async deleteMe(id: number) {
    await this.db.query('DELETE FROM users WHERE id=$1', [id]);
    return { ok: true };
  }
}
