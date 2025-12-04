import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class HomepageService {
  constructor(private readonly db: DatabaseService) {}

  async getAll() {
    const { rows } = await this.db.query(
      'SELECT section_name, content FROM homepage_content ORDER BY section_name ASC'
    );
    return rows;
  }

  async upsert(sectionName: string, content: string) {
    const { rows } = await this.db.query(
      `INSERT INTO homepage_content (section_name, content)
       VALUES ($1,$2)
       ON CONFLICT (section_name) DO UPDATE SET content=EXCLUDED.content
       RETURNING section_name, content`,
      [sectionName, content || '']
    );
    return rows[0];
  }
}
