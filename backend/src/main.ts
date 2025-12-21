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
  const frontendUrl =
    configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const sessionSecret =
    configService.get<string>('SESSION_SECRET') || 'dev-secret';

  app.setGlobalPrefix('api');

  app.use(cookieParser(sessionSecret));

  app.enableCors({
    origin: [frontendUrl, 'http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  });

  app.use(helmet());
  app.use(compression());

  // ✅ Render sets X-Forwarded-* headers. Trust proxy so rate-limit can read real client IP.
  const expressApp = app.getHttpAdapter().getInstance();
  if (nodeEnv === 'production' && typeof expressApp?.set === 'function') {
    expressApp.set('trust proxy', 1);
  }

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
  console.log(`Nest backend listening on ${port} (${nodeEnv})`);
}

bootstrap();
