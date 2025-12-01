// backend/src/users/users.controller.ts
import { Controller, Get, Req } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get('me')
  getMe(@Req() req: any) {
    // ตอนนี้ยังไม่ได้ผูก JWT Guard เลยอาจจะยังไม่มี req.user
    return req.user ?? null;
  }
}
