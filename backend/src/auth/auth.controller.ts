import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  Req,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { UsersService } from '../users/users.service';

function getBearerToken(req: Request): string | null {
  const h = req.headers['authorization'];
  if (!h) return null;
  const v = Array.isArray(h) ? h[0] : h;
  const m = v.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  private cookieOptions(remember: boolean) {
    const isProd =
      process.env.NODE_ENV === 'production' || !!process.env.RENDER_EXTERNAL_URL;

    // sameSite:none requires secure:true in modern browsers.
    const sameSite = isProd ? 'none' : 'lax';

    return {
      httpOnly: true,
      secure: isProd,
      sameSite: sameSite as 'none' | 'lax',
      path: '/',
      maxAge: remember
        ? 1000 * 60 * 60 * 24 * 30
        : 1000 * 60 * 60 * 24,
    };
  }

  private setAuthCookie(res: Response, token: string, remember: boolean) {
    res.cookie('token', token, this.cookieOptions(remember));
  }

  private clearAuthCookie(res: Response) {
    const isProd =
      process.env.NODE_ENV === 'production' || !!process.env.RENDER_EXTERNAL_URL;
    const sameSite = isProd ? 'none' : 'lax';

    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: sameSite as 'none' | 'lax',
      path: '/',
    });
  }

  // REGISTER
  @Post('register')
  async register(@Body('email') email: string) {
    return this.auth.register(email);
  }

  @Post('verify-code')
  async verifyCode(@Body('email') email: string, @Body('code') code: string) {
    return this.auth.verifyCode(email, code);
  }

  @Post('complete-profile')
  async completeProfile(
    @Body('email') email: string,
    @Body('username') username: string,
    @Body('password') password: string,
    @Res() res: Response,
  ) {
    const user = await this.auth.completeProfile(email, username, password);
    const token = this.auth.signToken(user);
    this.setAuthCookie(res, token, true);

    return res.json({ ok: true, role: user.role });
  }

  // LOGIN
  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('remember') remember: boolean,
    @Res() res: Response,
  ) {
    const user = await this.auth.login(email, password);
    const token = this.auth.signToken(user);
    this.setAuthCookie(res, token, !!remember);

    // (Optional) token fallback (frontend stores in localStorage when cookies are blocked)
    return res.json({
      ok: true,
      role: user.role,
      token,
    });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    this.clearAuthCookie(res);
    return res.json({ ok: true });
  }

  // FORGOT / RESET PASSWORD
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.auth.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.auth.resetPassword(token, newPassword);
  }

  // GOOGLE WEB FLOW
  @Get('google')
  async google(@Res() res: Response) {
    const url = this.auth.getGoogleAuthUrl();
    return res.redirect(url);
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const user = await this.auth.handleGoogleCallback(code);
      const token = this.auth.signToken(user);
      this.setAuthCookie(res, token, true);

      const fe = process.env.FRONTEND_URL || '';
      const hash = `#token=${encodeURIComponent(token)}&role=${encodeURIComponent(
        user.role || 'user',
      )}`;

      if (!user.username) {
        return res.redirect(
          `${fe}/form?email=${encodeURIComponent(user.email)}${hash}`,
        );
      }
      if (user.role === 'admin') {
        return res.redirect(`${fe}/admin${hash}`);
      }
      return res.redirect(`${fe}/home${hash}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('google callback error', e);
      const fe = process.env.FRONTEND_URL || '';
      return res.redirect(`${fe}/login?error=oauth_failed`);
    }
  }

  // STATUS
  @Get('status')
  async status(@Req() req: Request) {
    const token =
      (req as any).cookies?.token || getBearerToken(req) || (req.query?.token as any);
    return this.auth.statusFromToken(token);
  }

  // ME
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    const u = await this.users.findUserById(user.id);
    if (!u) return { error: 'Not found' };
    const { id, username, email, role, profile_picture_url } = u;
    return { id, username, email, role, profile_picture_url };
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(@CurrentUser() user: any, @Body('username') username?: string) {
    const updated = await this.users.updateProfile(user.id, { username });
    return {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      role: updated.role,
      profile_picture_url: updated.profile_picture_url,
    };
  }
}
