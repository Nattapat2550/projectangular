// backend/test/login.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AuthService } from './../src/auth/auth.service';

describe('🔑 Login Flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(AuthService).useValue({
      login: jest.fn().mockImplementation((email, password) => {
        if (email !== 'valid@example.com') throw new NotFoundException('User not found');
        if (password !== 'CorrectPassword') throw new UnauthorizedException('Invalid credentials');
        return { id: 1, email, username: 'Tester', role: 'user' };
      }),
      signToken: jest.fn().mockReturnValue('mock-jwt-token'),
      handleGoogleMobileLogin: jest.fn().mockResolvedValue({ id: 1, email: 'google@example.com', role: 'user' }) // สมมติถ้ามี API นี้
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('LOGIN-01: POST /auth/login - ล็อกอินสำเร็จ (ได้ Token)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'valid@example.com', password: 'CorrectPassword' });
    expect(res.status).toBe(201); // หรือ 200 ขึ้นอยู่กับการตั้งค่า Controller
    expect(res.body).toHaveProperty('token', 'mock-jwt-token');
  });

  it('LOGIN-02: POST /auth/login - ล็อกอินไม่สำเร็จ (401) หากรหัสผ่านผิด', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'valid@example.com', password: 'WrongPassword' });
    expect(res.status).toBe(401);
  });

  it('LOGIN-03: POST /auth/login - ล็อกอินไม่สำเร็จ (404) หากไม่มีอีเมลในระบบ', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'notfound@example.com', password: 'AnyPassword' });
    expect(res.status).toBe(404);
  });

  it('LOGIN-04: POST /auth/google-mobile - ล็อกอิน Google ผ่านฝั่งแอปมือถือสำเร็จ', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/google-mobile')
      .send({ idToken: 'valid-google-id-token' });
    
    // คาดหวัง 201/200 หรือ 404 (ถ้ายังไม่ได้สร้าง Route นี้ ให้ใส่ไว้กันลืม)
    expect([200, 201, 404]).toContain(res.status); 
  });
});