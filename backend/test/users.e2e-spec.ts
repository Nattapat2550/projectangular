import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('👤 Users Profile (e2e)', () => {
  let app: INestApplication;
  let userToken = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // จำลองการล็อกอินเพื่อเอา Token มาเทส
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' }); // เปลี่ยนเป็น user ใน DB เทส
    userToken = loginRes.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('USR-01: GET /users/me - ขอข้อมูลโดยไม่มี Token ต้องโดนบล็อก', async () => {
    const res = await request(app.getHttpServer()).get('/users/me');
    expect(res.status).toBe(401);
  });

  it('USR-02: GET /users/me - ดูข้อมูลส่วนตัว (มี Token)', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email');
  });

  it('USR-03: PUT /users/me - อัปเดตชื่อผู้ใช้', async () => {
    const res = await request(app.getHttpServer())
      .put('/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ username: 'NewNestName' });
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('NewNestName');
  });

  it('USR-04: POST /users/me/avatar - อัปโหลดรูปโปรไฟล์สำเร็จ', async () => {
    const dummyImage = Buffer.from('fake-image', 'utf-8');
    const res = await request(app.getHttpServer())
      .post('/users/me/avatar')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('avatar', dummyImage, { filename: 'test.jpg', contentType: 'image/jpeg' });
      
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('profile_picture_url');
  });

  it('USR-05: POST /users/me/avatar - บล็อกไฟล์ที่ไม่ใช่รูปภาพ', async () => {
    const dummyText = Buffer.from('this is text', 'utf-8');
    const res = await request(app.getHttpServer())
      .post('/users/me/avatar')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('avatar', dummyText, { filename: 'test.txt', contentType: 'text/plain' });
      
    expect(res.status).toBe(400); // Bad Request (Validation Pipe)
  });
});