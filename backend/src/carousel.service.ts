import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class CarouselService {
  constructor(private readonly db: DatabaseService) {}

  async listPublic() {
    const { rows } = await this.db.query(
      `SELECT id, item_index, title, subtitle, description, image_dataurl
       FROM carousel_items
       ORDER BY item_index ASC, id ASC`
    );
    return rows;
  }

  async listAdmin() {
    return this.listPublic();
  }

  async create(itemIndex: number, title: string, subtitle: string, desc: string, imageDataUrl: string | null) {
    const { rows } = await this.db.query(
      `INSERT INTO carousel_items (item_index, title, subtitle, description, image_dataurl)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, item_index, title, subtitle, description, image_dataurl`,
      [itemIndex, title || null, subtitle || null, desc || null, imageDataUrl]
    );
    return rows[0];
  }

  async update(
    id: number,
    itemIndex: number | null,
    title?: string | null,
    subtitle?: string | null,
    desc?: string | null,
    imageDataUrl?: string | null
  ) {
    const { rows } = await this.db.query(
      `UPDATE carousel_items
       SET item_index = COALESCE($2, item_index),
           title = COALESCE($3, title),
           subtitle = COALESCE($4, subtitle),
           description = COALESCE($5, description),
           image_dataurl = COALESCE($6, image_dataurl)
       WHERE id=$1
       RETURNING id, item_index, title, subtitle, description, image_dataurl`,
      [id, itemIndex, title, subtitle, desc, imageDataUrl]
    );
    return rows[0];
  }

  async delete(id: number) {
    await this.db.query('DELETE FROM carousel_items WHERE id=$1', [id]);
    return { ok: true };
  }
}
