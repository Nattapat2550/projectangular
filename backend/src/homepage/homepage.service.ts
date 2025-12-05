import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HomepageService {
  constructor(private readonly db: DatabaseService) {}

  async getHomepageContent() {
    const { rows } = await this.db.query(
      'SELECT section_name, content FROM homepage_content ORDER BY section_name ASC',
    );
    return rows;
  }

  async upsertSection(sectionName: string, content: string) {
    const q = `
      INSERT INTO homepage_content (section_name, content)
      VALUES ($1,$2)
      ON CONFLICT (section_name) DO UPDATE SET content=EXCLUDED.content
      RETURNING section_name, content`;
    const { rows } = await this.db.query(q, [sectionName, content || '']);
    return rows[0];
  }
}