import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async createUserByEmail(email: string) {
    const q = `
      INSERT INTO users (email, is_email_verified)
      VALUES ($1, FALSE)
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING *`;
    const { rows } = await this.db.query(q, [email]);
    return rows[0];
  }

  async findUserByEmail(email: string) {
    const { rows } = await this.db.query('SELECT * FROM users WHERE email=$1', [
      email,
    ]);
    return rows[0] || null;
  }

  async findUserById(id: number) {
    const { rows } = await this.db.query('SELECT * FROM users WHERE id=$1', [
      id,
    ]);
    return rows[0] || null;
  }

  async findUserByOAuth(provider: string, oauthId: string) {
    const { rows } = await this.db.query(
      'SELECT * FROM users WHERE oauth_provider=$1 AND oauth_id=$2',
      [provider, oauthId],
    );
    return rows[0] || null;
  }

  async markEmailVerified(userId: number) {
    const { rows } = await this.db.query(
      'UPDATE users SET is_email_verified=TRUE WHERE id=$1 RETURNING *',
      [userId],
    );
    return rows[0];
  }

  async setUsernameAndPassword(
    email: string,
    username: string,
    password: string,
  ) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const q = `UPDATE users SET username=$2, password_hash=$3 WHERE email=$1 AND is_email_verified=TRUE RETURNING *`;
    const { rows } = await this.db.query(q, [email, username, hash]);
    return rows[0] || null;
  }

  async updateProfile(userId: number, data: { username?: string; profilePictureUrl?: string }) {
    const { username, profilePictureUrl } = data;
    const { rows } = await this.db.query(
      `UPDATE users SET
         username = COALESCE($2, username),
         profile_picture_url = COALESCE($3, profile_picture_url)
       WHERE id=$1
       RETURNING *`,
      [userId, username || null, profilePictureUrl || null],
    );
    return rows[0];
  }

  async deleteUser(userId: number) {
    await this.db.query('DELETE FROM users WHERE id=$1', [userId]);
  }

  async getAllUsers() {
    const { rows } = await this.db.query(
      `SELECT id, username, email, role, profile_picture_url, is_email_verified, created_at, updated_at
       FROM users
       ORDER BY id ASC`,
    );
    return rows;
  }

  async storeVerificationCode(userId: number, code: string, expiresAt: Date) {
    await this.db.query('DELETE FROM verification_codes WHERE user_id=$1', [
      userId,
    ]);
    const { rows } = await this.db.query(
      `INSERT INTO verification_codes (user_id, code, expires_at)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [userId, code, expiresAt],
    );
    return rows[0];
  }

  async validateAndConsumeCode(email: string, code: string) {
    const user = await this.findUserByEmail(email);
    if (!user) return { ok: false, reason: 'no_user' as const };

    const { rows } = await this.db.query(
      `SELECT * FROM verification_codes
       WHERE user_id=$1 AND code=$2 AND expires_at > NOW()`,
      [user.id, code],
    );
    const rec = rows[0];
    if (!rec) return { ok: false, reason: 'invalid_or_expired' as const };

    await this.db.query('DELETE FROM verification_codes WHERE id=$1', [
      rec.id,
    ]);
    await this.markEmailVerified(user.id);
    return { ok: true, userId: user.id };
  }

  async setOAuthUser(args: {
    email: string;
    provider: string;
    oauthId: string;
    pictureUrl?: string;
    name?: string;
  }) {
    const { email, provider, oauthId, pictureUrl } = args;
    const existingByOAuth = await this.findUserByOAuth(provider, oauthId);
    if (existingByOAuth) return existingByOAuth;

    const existingByEmail = await this.findUserByEmail(email);
    if (existingByEmail) {
      const { rows } = await this.db.query(
        `UPDATE users SET
           oauth_provider = COALESCE($2, oauth_provider),
           oauth_id = COALESCE($3, oauth_id),
           is_email_verified = TRUE,
           profile_picture_url = COALESCE($4, profile_picture_url)
         WHERE email=$1
         RETURNING *`,
        [email, provider, oauthId, pictureUrl || null],
      );
      return rows[0];
    }

    const { rows } = await this.db.query(
      `INSERT INTO users (email, oauth_provider, oauth_id, is_email_verified, profile_picture_url, username)
       VALUES ($1,$2,$3,TRUE,$4, split_part($5,'@',1))
       RETURNING *`,
      [email, provider, oauthId, pictureUrl || null, email],
    );
    return rows[0];
  }

  private hashToken(raw: string) {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  async createPasswordResetToken(
    email: string,
    token: string,
    expiresAt: Date,
  ) {
    const user = await this.findUserByEmail(email);
    if (!user) return null;
    await this.db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, is_used)
       VALUES ($1,$2,$3,FALSE)`,
      [user.id, this.hashToken(token), expiresAt],
    );
    return user;
  }

  async consumePasswordResetToken(rawToken: string) {
    const token = this.hashToken(rawToken);
    const { rows } = await this.db.query(
      `SELECT * FROM password_reset_tokens
       WHERE token=$1 AND is_used=FALSE AND expires_at > NOW()`,
      [token],
    );
    const rec = rows[0];
    if (!rec) return null;
    await this.db.query(
      'UPDATE password_reset_tokens SET is_used=TRUE WHERE id=$1',
      [rec.id],
    );
    const user = await this.findUserById(rec.user_id);
    return user;
  }

  async setPassword(userId: number, newPassword: string) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    const { rows } = await this.db.query(
      'UPDATE users SET password_hash=$2 WHERE id=$1 RETURNING *',
      [userId, hash],
    );
    return rows[0];
  }
}
