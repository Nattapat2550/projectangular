// test/auth.e2e-spec.ts
process.env.GOOGLE_CLIENT_ID = 'mock-id';
process.env.GOOGLE_CLIENT_SECRET = 'mock-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost';
process.env.GOOGLE_REFRESH_TOKEN = 'mock-token';
process.env.JWT_SECRET = 'mock-secret';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AuthService } from './../src/auth/auth.service';

describe('🔐 Auth Flow (e2e)', () => {
  let app: INestApplication;
  const newEmail = `test_${Date.now()}@example.com`;
  let userToken = 'mock-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    // จำลอง AuthService เพื่อข้ามการต่อ DB และการส่งอีเมลจริง
    .overrideProvider(AuthService).useValue({
      register: jest.fn().mockResolvedValue({ ok: true, emailSent: true }),
      verifyCode: jest.fn().mockResolvedValue({ ok: true }),
      completeProfile: jest.fn().mockResolvedValue({ id: 1, email: newEmail, username: 'NestTester', role: 'user' }),
      signToken: jest.fn().mockReturnValue('mock-token'),
      login: jest.fn().mockImplementation((email, password) => {
        if (password === 'WrongPassword') throw new UnauthorizedException();
        return { id: 1, email, username: 'NestTester', role: 'user' };
      }),
      getGoogleAuthUrl: jest.fn().mockReturnValue('http://mock-google-url')
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('AUTH-01: POST /auth/register - สมัครสมาชิกใหม่สำเร็จ', async () => {
    const res = await request(app.getHttpServer()).post('/auth/register').send({ email: newEmail });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  it('AUTH-03: POST /auth/verify-code - ยืนยันรหัส OTP ถูกต้อง', async () => {
    const res = await request(app.getHttpServer()).post('/auth/verify-code').send({ email: newEmail, code: '123456' });
    expect([200, 201]).toContain(res.status);
    expect(res.body.ok).toBe(true);
  });

  it('AUTH-05: POST /auth/complete-profile - ตั้งชื่อและรหัสผ่าน (ได้ Token)', async () => {
    const res = await request(app.getHttpServer()).post('/auth/complete-profile')
      .send({ email: newEmail, username: 'NestTester', password: 'Password123!' });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('token');
  });

  it('AUTH-06: POST /auth/login - เข้าสู่ระบบด้วยรหัสผ่านสำเร็จ', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login')
      .send({ email: newEmail, password: 'Password123!', remember: true });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('token');
  });

  it('AUTH-07: POST /auth/login - เข้าสู่ระบบด้วยรหัสผ่านผิด', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login')
      .send({ email: newEmail, password: 'WrongPassword' });
    expect([400, 401]).toContain(res.status);
  });

  it('AUTH-09: POST /auth/logout - ออกจากระบบ', async () => {
    const res = await request(app.getHttpServer()).post('/auth/logout')
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.ok).toBe(true);
  });

  it('AUTH-12: GET /auth/google - สร้ง URL สำหรับล็อกอิน Google', async () => {
    const res = await request(app.getHttpServer()).get('/auth/google');
    expect(res.status).toBe(302);
  });
});