import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CarouselService {
  constructor(private readonly db: DatabaseService) {}

  async listCarouselItems() {
    const { rows } = await this.db.query(
      `SELECT id, item_index, title, subtitle, description, image_dataurl
         FROM carousel_items
        ORDER BY item_index ASC, id ASC`,
    );
    return rows;
  }

  async createCarouselItem(args: {
    itemIndex: number;
    title?: string;
    subtitle?: string;
    description?: string;
    imageDataUrl?: string;
  }) {
    const { itemIndex, title, subtitle, description, imageDataUrl } = args;
    const { rows } = await this.db.query(
      `INSERT INTO carousel_items (item_index, title, subtitle, description, image_dataurl)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, item_index, title, subtitle, description, image_dataurl`,
      [itemIndex, title || null, subtitle || null, description || null, imageDataUrl || null],
    );
    return rows[0];
  }

  async updateCarouselItem(id: number, args: {
    itemIndex?: number;
    title?: string;
    subtitle?: string;
    description?: string;
    imageDataUrl?: string;
  }) {
    const { itemIndex, title, subtitle, description, imageDataUrl } = args;
    const { rows } = await this.db.query(
      `UPDATE carousel_items SET
         item_index = COALESCE($2, item_index),
         title = COALESCE($3, title),
         subtitle = COALESCE($4, subtitle),
         description = COALESCE($5, description),
         image_dataurl = COALESCE($6, image_dataurl)
       WHERE id=$1
       RETURNING id, item_index, title, subtitle, description, image_dataurl`,
      [id, itemIndex, title || null, subtitle || null, description || null, imageDataUrl || null],
    );
    return rows[0] || null;
  }

  async deleteCarouselItem(id: number) {
    await this.db.query('DELETE FROM carousel_items WHERE id=$1', [id]);
  }
}
