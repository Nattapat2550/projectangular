import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/env.config';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './email/email.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HomepageModule } from './homepage/homepage.module';
import { CarouselModule } from './carousel/carousel.module';
import { AdminModule } from './admin/admin.module';
import { DownloadModule } from './download/download.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    DatabaseModule,
    EmailModule,
    UsersModule,
    AuthModule,
    HomepageModule,
    CarouselModule,
    AdminModule,
    DownloadModule,
  ],
})
export class AppModule {}
