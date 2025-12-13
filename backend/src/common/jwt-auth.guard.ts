import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();

    const token = (req.cookies as any)?.token;
    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }

    try {
      const payload = jwt.verify(
        token,
        this.config.get<string>('JWT_SECRET') || 'dev-jwt',
      ) as any;
      (req as any).user = {
        id: payload.id,
        role: payload.role || 'user',
      };
      return true;
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
