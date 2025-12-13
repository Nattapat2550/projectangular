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
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const sessionSecret = configService.get<string>('SESSION_SECRET') || 'dev-secret';

  app.setGlobalPrefix('api');

  // ✅ default import → เรียกได้ตรง ๆ
  app.use(cookieParser(sessionSecret));

  app.enableCors({
    origin: [frontendUrl, 'http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  });

  // ✅ default import → เรียกได้ตรง ๆ
  app.use(helmet());

  app.use(compression());

  app.use(
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

  await app.listen(port);
  // tslint:disable-next-line:no-console
  console.log(`Nest backend listening on ${port} (${nodeEnv})`);
}

bootstrap();
