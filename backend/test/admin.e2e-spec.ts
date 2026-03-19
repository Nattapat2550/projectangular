import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('👑 Admin Features (e2e)', () => {
  let app: INestApplication;
  let adminToken = '';
  let userToken = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // ดึง Token ของ Admin และ User ธรรมดา เพื่อมาจำลองสิทธิ์
    // สมมติว่ามีระบบ Login ให้ทดสอบก่อน
    const userRes = await request(app.getHttpServer()).post('/auth/login').send({ email: 'user@test.com', password: '123' });
    userToken = userRes.body.token;

    const adminRes = await request(app.getHttpServer()).post('/auth/login').send({ email: 'admin@test.com', password: '123' });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('ADM-01: GET /admin/users - User ทั่วไปเข้าไม่ได้ (403 Forbidden)', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect([401, 403]).toContain(res.status);
  });

  it('ADM-02: GET /admin/users - Admin ดึงรายชื่อคนทั้งหมดได้', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('ADM-04: POST /admin/carousel - Admin สร้าง Carousel สไลด์ใหม่สำเร็จ', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/carousel')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        item_index: 1,
        title: 'New Banner',
        subtitle: 'By Admin',
        image_dataurl: 'data:image/png;base64,iVBORw0K...'
      });
    expect(res.status).toBe(201);
  });

  it('ADM-07: DELETE /admin/carousel/:id - Admin ลบ Carousel ได้', async () => {
    const res = await request(app.getHttpServer())
      .delete('/admin/carousel/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});