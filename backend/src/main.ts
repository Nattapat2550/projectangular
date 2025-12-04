import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: true,           // ยอมทุก origin (ถ้าอยากล็อกทีหลัง ค่อยปรับ)
    credentials: true
  });

  app.setGlobalPrefix('');  // ใช้ path ตาม controller ตรง ๆ เช่น /api/auth/login

  const port = process.env.PORT || 5000;
  await app.listen(port as number);
  console.log(`NestJS backend running on port ${port}`);
}
bootstrap();
