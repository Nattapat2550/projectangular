import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : undefined
    });
  }

  async onModuleInit() {
    await this.pool.query('SELECT 1'); // health check

    // สร้างตารางหลัก (ถ้ามีอยู่แล้วจะไม่ error)
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT,
        password_hash TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        profile_picture_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS email_verification_codes (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token_hash TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS homepage_content (
        section_name TEXT PRIMARY KEY,
        content TEXT
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS carousel_items (
        id SERIAL PRIMARY KEY,
        item_index INTEGER NOT NULL,
        title TEXT,
        subtitle TEXT,
        description TEXT,
        image_dataurl TEXT
      );
    `);
  }

  async query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
    return this.pool.query(text, params);
  }
}
