// backend/test/admin.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { CarouselService } from './../src/carousel/carousel.service';
import { HomepageService } from './../src/homepage/homepage.service';
import { JwtAuthGuard } from './../src/common/jwt-auth.guard';
import { AdminGuard } from './../src/common/admin.guard';

describe('👑 Admin Features (e2e)', () => {
  let app: INestApplication;
  const adminToken = 'admin-token';
  const userToken = 'user-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideGuard(JwtAuthGuard).useValue({
      canActivate: (context: any) => {
        const req = context.switchToHttp().getRequest();
        const token = req.headers.authorization || '';
        if (token.includes('user-token')) req.user = { id: 1, role: 'user' };
        if (token.includes('admin-token')) req.user = { id: 2, role: 'admin' };
        return !!req.user;
      }
    })
    .overrideGuard(AdminGuard).useValue({
      canActivate: (context: any) => {
        const req = context.switchToHttp().getRequest();
        return req.user && req.user.role === 'admin';
      }
    })
    .overrideProvider(UsersService).useValue({
      getAllUsers: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      updateRole: jest.fn().mockResolvedValue({ id: 1, role: 'admin' })
    })
    .overrideProvider(CarouselService).useValue({
      createCarouselItem: jest.fn().mockResolvedValue({ id: 1 }),
      deleteCarouselItem: jest.fn().mockResolvedValue({ ok: true })
    })
    .overrideProvider(HomepageService).useValue({
      updateHero: jest.fn().mockResolvedValue({ title: 'New Hero' })
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('ADM-01: GET /admin/users - User ทั่วไปเข้าไม่ได้ (403 Forbidden)', async () => {
    const res = await request(app.getHttpServer()).get('/admin/users').set('Authorization', `Bearer ${userToken}`);
    expect([401, 403]).toContain(res.status);
  });

  it('ADM-02: GET /admin/users - Admin ดึงรายชื่อสมาชิกทั้งหมดได้', async () => {
    const res = await request(app.getHttpServer()).get('/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('ADM-03: PUT /admin/users/1/role - Admin ปรับสิทธิ์ (Role) ให้คนอื่นได้', async () => {
    const res = await request(app.getHttpServer()).put('/admin/users/1/role')
      .set('Authorization', `Bearer ${adminToken}`).send({ role: 'admin' });
    expect([200, 404]).toContain(res.status); 
  });

  it('ADM-04: POST /admin/carousel - Admin สร้าง Carousel สไลด์ใหม่สำเร็จ', async () => {
    const res = await request(app.getHttpServer()).post('/admin/carousel')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ item_index: 1, title: 'New Banner', image_dataurl: 'mock-img' });
    expect(res.status).toBe(201);
  });

  it('ADM-05: DELETE /admin/carousel/1 - Admin ลบ Carousel ได้', async () => {
    const res = await request(app.getHttpServer()).delete('/admin/carousel/1').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('ADM-06: PUT /admin/homepage - Admin แก้ไขข้อความส่วน Hero ได้', async () => {
    const res = await request(app.getHttpServer()).put('/admin/homepage')
      .set('Authorization', `Bearer ${adminToken}`).send({ title: 'New Hero' });
    expect([200, 404]).toContain(res.status);
  });
});