// test/users.e2e-spec.ts
process.env.GOOGLE_CLIENT_ID = 'mock-id';
process.env.GOOGLE_CLIENT_SECRET = 'mock-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost';
process.env.GOOGLE_REFRESH_TOKEN = 'mock-token';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { JwtAuthGuard } from './../src/common/jwt-auth.guard';

describe('👤 Users Profile (e2e)', () => {
  let app: INestApplication;
  let userToken = 'fake-valid-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    // จำลอง Guard ให้ตรวจผ่านทันทีถ้าแนบ Token ปลอมๆ มา
    // จำลอง Guard ให้ตรวจผ่านทันทีถ้าแนบ Token ปลอมๆ มา
    .overrideGuard(JwtAuthGuard).useValue({
      canActivate: (context: any) => {
        const req = context.switchToHttp().getRequest();
        // ถ้าไม่มี token ให้โยน 401 ออกไปแทนการ return false
        if (!req.headers.authorization) {
          throw new UnauthorizedException(); 
        }
        req.user = { id: 1, email: 'test@example.com' };
        return true;
      }
    })
    // จำลอง Database Service ของ Users
    .overrideProvider(UsersService).useValue({
      findUserById: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com', username: 'TestUser', role: 'user' }),
      updateProfile: jest.fn().mockImplementation((id, data) => ({
        id: 1, email: 'test@example.com', username: data.username || 'TestUser', profile_picture_url: data.profilePictureUrl || 'mock-url'
      }))
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('USR-01: GET /users/me - ขอข้อมูลโดยไม่มี Token ต้องโดนบล็อก', async () => {
    const res = await request(app.getHttpServer()).get('/users/me');
    expect(res.status).toBe(401);
  });

  it('USR-02: GET /users/me - ดูข้อมูลส่วนตัว (มี Token)', async () => {
    const res = await request(app.getHttpServer()).get('/users/me').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email');
  });

  it('USR-03: PUT /users/me - อัปเดตชื่อผู้ใช้', async () => {
    const res = await request(app.getHttpServer()).put('/users/me')
      .set('Authorization', `Bearer ${userToken}`).send({ username: 'NewNestName' });
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('NewNestName');
  });

  it('USR-04: POST /users/me/avatar - อัปโหลดรูปโปรไฟล์สำเร็จ', async () => {
    const dummyImage = Buffer.from('fake-image', 'utf-8');
    const res = await request(app.getHttpServer()).post('/users/me/avatar')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('avatar', dummyImage, { filename: 'test.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('profile_picture_url');
  });

  it('USR-05: POST /users/me/avatar - บล็อกไฟล์ที่ไม่ใช่รูปภาพ', async () => {
    const dummyText = Buffer.from('this is text', 'utf-8');
    const res = await request(app.getHttpServer()).post('/users/me/avatar')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('avatar', dummyText, { filename: 'test.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400); 
  });
});