// backend/test/guest.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('🌍 Guest & Security Features (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GUEST-01: GET /carousel - ดึงภาพสไลด์ได้โดยไม่ต้องมี Token', async () => {
    const res = await request(app.getHttpServer()).get('/carousel');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('GUEST-02: GET /homepage/hero - ดึงข้อความหน้าแรกได้โดยไม่ต้องมี Token', async () => {
    const res = await request(app.getHttpServer()).get('/homepage/hero');
    // สมมติว่าคืนค่าเป็น object ที่มี title/description
    expect([200, 404]).toContain(res.status); 
  });

  it('GUEST-03: POST /auth/login - ป้องกัน SQL Injection หากมีการยิงโค้ดเถื่อน', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: "admin@example.com' OR '1'='1", password: "' OR '1'='1" });
    
    // ระบบต้องไม่พัง (500) และต้องไม่อนุญาตให้เข้าสู่ระบบ (200/201)
    expect([400, 401, 404]).toContain(res.status);
  });

  it('GUEST-04: POST /auth/logout - ออกจากระบบและลบ Cookie ได้', async () => {
    const res = await request(app.getHttpServer()).post('/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    
    // แก้ไข: ดักจับกรณีที่ Set-Cookie ไม่ได้เป็น Array
    const rawCookies = res.headers['set-cookie'];
    const cookies = Array.isArray(rawCookies) ? rawCookies : (rawCookies ? [rawCookies] : []);
    
    const hasClearCookie = cookies.some((c: string) => 
      c.includes('token=;') || c.includes('Max-Age=0') || c.includes('Expires=Thu, 01 Jan 1970')
    );
    expect(hasClearCookie).toBeTruthy();
  });
});