import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { HomepageService } from './homepage.service';
import { CarouselService } from './carousel.service';
import { AdminService } from './admin.service';

import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';
import { HomepageController } from './homepage.controller';
import { CarouselController } from './carousel.controller';
import { AdminController } from './admin.controller';
import { DownloadController } from './download.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
      // ใช้ .env เดิมใน root โปรเจคได้ (Render จะใส่ env ให้เอง)
    })
  ],
  controllers: [
    AuthController,
    UsersController,
    HomepageController,
    CarouselController,
    AdminController,
    DownloadController
  ],
  providers: [
    DatabaseService,
    AuthService,
    UsersService,
    HomepageService,
    CarouselService,
    AdminService
  ]
})
export class AppModule {}
