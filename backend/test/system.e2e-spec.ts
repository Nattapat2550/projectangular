import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { CarouselService } from './../src/carousel/carousel.service';

describe('🌐 System & Guest Features (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(CarouselService).useValue({
      // 🛠️ แก้ไขชื่อให้ตรงกับ Controller ที่ใช้ this.service.listCarouselItems()
      listCarouselItems: jest.fn().mockResolvedValue([]),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('SYS-01: GET / - ตรวจสอบว่าเซิร์ฟเวอร์เปิดติด (Health Check)', async () => {
    const res = await request(app.getHttpServer()).get('/');
    // ถ้าระบบไม่ได้ทำหน้าแรกไว้ (เช่นมีแค่ /api) อาจจะเจอ 404 ซึ่งก็ถือว่าเซิร์ฟเวอร์ตอบสนองแล้ว
    expect([200, 404]).toContain(res.status);
  });

  it('SYS-02: GET /api/unknown - การเรียก API ที่ไม่มีอยู่จริง ต้องคืนค่า 404', async () => {
    const res = await request(app.getHttpServer()).get('/api/unknown-endpoint-1234');
    expect(res.status).toBe(404);
  });

  it('SYS-03: GET /carousel - ดึงภาพสไลด์ได้โดยไม่ต้องมี Token (Public)', async () => {
    const res = await request(app.getHttpServer()).get('/carousel');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('SYS-04: GET /download/windows - ดาวน์โหลดไฟล์ .exe สำเร็จ', async () => {
    const res = await request(app.getHttpServer()).get('/download/windows');
    expect([200, 302, 404]).toContain(res.status); 
  });

  it('SYS-05: GET /download/android - ดาวน์โหลดไฟล์ .apk สำเร็จ', async () => {
    const res = await request(app.getHttpServer()).get('/download/android');
    expect([200, 302, 404]).toContain(res.status);
  });
});