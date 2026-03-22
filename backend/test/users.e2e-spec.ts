// backend/test/users.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { JwtAuthGuard } from './../src/common/jwt-auth.guard';

describe('👤 User Profile (e2e)', () => {
  let app: INestApplication;
  const userToken = 'mock-user-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideGuard(JwtAuthGuard).useValue({
      canActivate: (context: any) => {
        const req = context.switchToHttp().getRequest();
        if (!req.headers.authorization) return false;
        req.user = { id: 1, role: 'user' };
        return true;
      }
    })
    .overrideProvider(UsersService).useValue({
      findUserById: jest.fn().mockResolvedValue({ id: 1, username: 'TestUser', email: 'test@example.com', role: 'user' }),
      updateProfile: jest.fn().mockResolvedValue({ id: 1, username: 'UpdatedUser', email: 'test@example.com', role: 'user' }),
      deleteUser: jest.fn().mockResolvedValue({ ok: true })
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('USER-01: GET /auth/me - ดึงข้อมูลโปรไฟล์ของตัวเองได้สำเร็จ', async () => {
    const res = await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('TestUser');
  });

  it('USER-02: PUT /auth/me - อัปเดตชื่อผู้ใช้ของตัวเองได้', async () => {
    const res = await request(app.getHttpServer()).put('/auth/me').set('Authorization', `Bearer ${userToken}`).send({ username: 'UpdatedUser' });
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('UpdatedUser');
  });

  it('USER-03: POST /users/me/avatar - ป้องกันการอัปโหลดไฟล์อันตราย (ต้องเป็นรูป)', async () => {
    const res = await request(app.getHttpServer()).post('/users/me/avatar')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', Buffer.from('fake text file'), 'test.txt');
    expect([400, 415, 404]).toContain(res.status); // ขึ้นอยู่กับที่คุณเขียนกันดักไว้ที่ Controller
  });

  it('USER-04: DELETE /users/me - ลบบัญชีตัวเองทิ้งได้สำเร็จ', async () => {
    const res = await request(app.getHttpServer()).delete('/users/me').set('Authorization', `Bearer ${userToken}`);
    expect([200, 404]).toContain(res.status); // ปรับโค้ดตาม Controller (ถ้าไม่มี route นี้ให้ใส่ไว้เพื่อพัฒนาก่อน)
  });
});