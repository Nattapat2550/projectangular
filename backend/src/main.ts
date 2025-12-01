// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // รองรับทั้งกรณี default export / namespace export
  const compressionFn: any = (compression as any).default || compression;
  const cookieParserFn: any = (cookieParser as any).default || cookieParser;

  app.use(compressionFn());

  const sessionSecret =
    configService.get<string>('SESSION_SECRET') || 'default_session_secret';

  app.use(cookieParserFn(sessionSecret));

  const frontendUrl =
    configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
}
bootstrap();
