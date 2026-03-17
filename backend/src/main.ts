import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5000;
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const sessionSecret = configService.get<string>('SESSION_SECRET') || 'dev-secret';

  app.setGlobalPrefix('api');
  app.use(cookieParser(sessionSecret));

  // ✅ 1. แก้ไขให้ดึง FRONTEND_URL รองรับแบบ Array (เหมือนโปรเจคอื่นๆ)
  const normalizeOrigin = (s: string) => (s ? s.trim().replace(/\/+$/, '') : '');
  const allowedOrigins = (configService.get<string>('FRONTEND_URL') || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  app.enableCors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      // ให้ผ่านถ้าเป็นการ Dev
      if (nodeEnv !== 'production') return callback(null, true);
      
      // ถ้าไม่ได้ตั้งค่า FRONTEND_URL ให้ผ่าน (กันพังตอน Deploy)
      if (allowedOrigins.length === 0) return callback(null, true);

      const o = normalizeOrigin(origin);
      if (allowedOrigins.includes(o)) return callback(null, true);
      
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  });

  app.use(helmet());
  app.use(compression());

  // ✅ 2. เปิด Trust proxy เพื่อให้ secure cookie และ rate-limit ทำงานถูกเสมอเวลาอยู่หลัง Proxy
  const expressApp = app.getHttpAdapter().getInstance();
  if (typeof expressApp?.set === 'function') {
    expressApp.set('trust proxy', 1);
  }

  // ✅ 3. บังคับ Rate Limit เฉพาะ path /api/auth ให้เหมือนฝั่ง Express
  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }) as any,
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(port, "0.0.0.0");
  console.log(`Nest backend listening on ${port} (${nodeEnv})`);
}

bootstrap();