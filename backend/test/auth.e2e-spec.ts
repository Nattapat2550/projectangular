import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

// จำลองคลาสส่งอีเมลเพื่อไม่ให้ส่งอีเมลจริงๆ ตอนรันเทส
class MockEmailService {
  async sendVerificationEmail() { return true; }
  async sendPasswordResetEmail() { return true; }
}

describe('🔐 Auth Flow (e2e)', () => {
  let app: INestApplication;
  const newEmail = `test_${Date.now()}@example.com`;
  let userToken = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // เราสามารถใช้ overrideProvider เพื่อ Mock Service ที่เชื่อมกับ API ภายนอกได้
      // .overrideProvider(EmailService).useClass(MockEmailService) 
      .compile();

    app = moduleFixture.createNestApplication();
    // ถ้าใน main.ts คุณมี app.setGlobalPrefix('api') ให้เปิดคอมเมนต์บรรทัดล่างนี้
    // app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('AUTH-01: POST /auth/register - สมัครสมาชิกใหม่สำเร็จ', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: newEmail });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  it('AUTH-03: POST /auth/verify-code - ยืนยันรหัส OTP ถูกต้อง', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/verify-code')
      .send({ email: newEmail, code: '123456' }); // อนุโลมตาม Mock
    expect([200, 201]).toContain(res.status);
    expect(res.body.ok).toBe(true);
  });

  it('AUTH-05: POST /auth/complete-profile - ตั้งชื่อและรหัสผ่าน (ได้ Token)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/complete-profile')
      .send({ 
        email: newEmail, 
        username: 'NestTester', 
        password: 'Password123!' 
      });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('token');
    userToken = res.body.token;
  });

  it('AUTH-06: POST /auth/login - เข้าสู่ระบบด้วยรหัสผ่านสำเร็จ', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: newEmail, password: 'Password123!', remember: true });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toEqual(newEmail);
  });

  it('AUTH-07: POST /auth/login - เข้าสู่ระบบด้วยรหัสผ่านผิด', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: newEmail, password: 'WrongPassword' });
    expect([400, 401]).toContain(res.status);
  });

  it('AUTH-09: POST /auth/logout - ออกจากระบบ', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.ok).toBe(true);
  });

  it('AUTH-12: GET /auth/google - สร้ง URL สำหรับล็อกอิน Google', async () => {
    const res = await request(app.getHttpServer()).get('/auth/google');
    expect(res.status).toBe(302); // ต้องมีการ Redirect ไปหน้า OAuth
  });
});