import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

function getBearerToken(req: Request): string | null {
  const h = req.headers['authorization'];
  if (!h) return null;
  const v = Array.isArray(h) ? h[0] : h;
  const m = v.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();

    const token =
      (req as any).cookies?.token ||
      getBearerToken(req) ||
      (req.query?.token as string | undefined) ||
      null;

    if (!token) throw new UnauthorizedException('Unauthorized');

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
