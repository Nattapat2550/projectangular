import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get('/')
  root(@Res() res: Response) {
    // ✅ ถ้ามี FRONTEND_URL ให้ redirect ไป UI
    const frontend = process.env.FRONTEND_URL;
    if (frontend) return res.redirect(frontend);

    // ✅ ถ้าไม่ได้ตั้ง FRONTEND_URL ให้ตอบว่า API ทำงานอยู่
    return res.status(200).json({
      ok: true,
      service: 'backend',
      message: 'API is running',
    });
  }

  // ✅ health check สำหรับเช็คว่า backend ติดจริง
  @Get('/health')
  health() {
    return { ok: true };
  }
}
