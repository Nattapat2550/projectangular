// backend/test/auth.e2e-spec.ts
process.env.GOOGLE_CLIENT_ID = 'mock-id';
process.env.GOOGLE_CLIENT_SECRET = 'mock-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost';
process.env.GOOGLE_REFRESH_TOKEN = 'mock-token';
process.env.JWT_SECRET = 'mock-secret';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AuthService } from './../src/auth/auth.service';

describe('🔐 Auth Flow & Login (e2e)', () => {
  let app: INestApplication;
  const testEmail = `test_${Date.now()}@example.com`;
  let userToken = 'mock-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(AuthService).useValue({
      register: jest.fn().mockResolvedValue({ ok: true, emailSent: true }),
      verifyCode: jest.fn().mockResolvedValue({ ok: true }),
      completeProfile: jest.fn().mockResolvedValue({ id: 1, email: testEmail, username: 'NestTester', role: 'user' }),
      signToken: jest.fn().mockReturnValue('mock-token'),
      login: jest.fn().mockImplementation((email, password) => {
        if (email !== testEmail) throw new NotFoundException();
        if (password === 'WrongPassword') throw new UnauthorizedException();
        return { id: 1, email, username: 'NestTester', role: 'user' };
      }),
      forgotPassword: jest.fn().mockResolvedValue({ ok: true }),
      resetPassword: jest.fn().mockResolvedValue({ ok: true }),
      getGoogleAuthUrl: jest.fn().mockReturnValue('http://mock-google-url')
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // --- Auth Flow ---
  it('AUTH-01: POST /auth/register - สมัครสมาชิกใหม่สำเร็จ', async () => {
    const res = await request(app.getHttpServer()).post('/auth/register').send({ email: testEmail });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  it('AUTH-02: POST /auth/verify-code - ยืนยันรหัส OTP ถูกต้อง', async () => {
    const res = await request(app.getHttpServer()).post('/auth/verify-code').send({ email: testEmail, code: '123456' });
    expect([200, 201]).toContain(res.status);
    expect(res.body.ok).toBe(true);
  });

  it('AUTH-03: POST /auth/complete-profile - ตั้งชื่อและรหัสผ่าน (ได้ Token)', async () => {
    const res = await request(app.getHttpServer()).post('/auth/complete-profile')
      .send({ email: testEmail, username: 'NestTester', password: 'Password123!' });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('token');
  });

  it('AUTH-04: POST /auth/forgot-password - ส่งลิงก์รีเซ็ตรหัสผ่านเข้าอีเมลสำเร็จ', async () => {
    const res = await request(app.getHttpServer()).post('/auth/forgot-password').send({ email: testEmail });
    expect([200, 201]).toContain(res.status);
    expect(res.body.ok).toBe(true);
  });

  it('AUTH-05: POST /auth/reset-password - เปลี่ยนรหัสผ่านใหม่ด้วย Token สำเร็จ', async () => {
    const res = await request(app.getHttpServer()).post('/auth/reset-password').send({ token: 'mock-reset-token', newPassword: 'NewPassword123!' });
    expect([200, 201]).toContain(res.status);
    expect(res.body.ok).toBe(true);
  });

  // --- Login ---
  it('LOGIN-01: POST /auth/login - ล็อกอินสำเร็จด้วยอีเมลและรหัสผ่านที่ถูกต้อง', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login')
      .send({ email: testEmail, password: 'Password123!', remember: true });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('token');
  });

  it('LOGIN-02: POST /auth/login - ล็อกอินไม่สำเร็จ (401) หากรหัสผ่านผิด', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login')
      .send({ email: testEmail, password: 'WrongPassword' });
    expect([400, 401]).toContain(res.status);
  });

  it('LOGIN-03: POST /auth/login - ล็อกอินไม่สำเร็จ (404) หากไม่มีอีเมลในระบบ', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login')
      .send({ email: 'unknown@example.com', password: 'Password123!' });
    expect([400, 401, 404]).toContain(res.status);
  });

  it('LOGIN-04: POST /auth/login - ป้องกัน SQL Injection พื้นฐาน (Mock handle)', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login')
      .send({ email: "' OR '1'='1", password: "' OR '1'='1" });
    expect([400, 401, 404]).toContain(res.status); // ไม่ยอมให้เข้าสู่ระบบ
  });

  // --- Google & Logout ---
  it('AUTH-06: GET /auth/google - สร้าง URL สำหรับล็อกอิน Google สำเร็จ', async () => {
    const res = await request(app.getHttpServer()).get('/auth/google');
    expect(res.status).toBe(302);
  });

  it('AUTH-07: POST /auth/logout - ออกจากระบบ', async () => {
    const res = await request(app.getHttpServer()).post('/auth/logout')
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.ok).toBe(true);
  });
});