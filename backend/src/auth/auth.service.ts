import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import * as jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private jwtSecret: string;
  private oauth2ClientWeb: any;

  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly email: EmailService,
  ) {
    this.jwtSecret = this.config.get<string>('JWT_SECRET') || 'dev-jwt';

    const webClientId =
      this.config.get<string>('GOOGLE_CLIENT_ID') ||
      this.config.get<string>('GOOGLE_CLIENT_ID_WEB');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackUri = this.config.get<string>('GOOGLE_CALLBACK_URI');

    if (webClientId && clientSecret && callbackUri) {
      this.oauth2ClientWeb = new google.auth.OAuth2(
        webClientId,
        clientSecret,
        callbackUri,
      );
    }
  }

  signToken(user: any) {
    return jwt.sign(
      { id: user.id, role: user.role },
      this.jwtSecret,
      { expiresIn: '30d' },
    );
  }

  async register(email: string) {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      throw new BadRequestException('Invalid email');
    }

    const existing = await this.users.findUserByEmail(email);
    if (existing && existing.is_email_verified) {
      throw new BadRequestException('Email already registered');
    }

    const user = existing || (await this.users.createUserByEmail(email));
    const code = this.generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.users.storeVerificationCode(user.id, code, expiresAt);

    await this.email.sendEmail({
      to: email,
      subject: 'Your verification code',
      text: `Your code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    });

    return { ok: true };
  }

  async verifyCode(email: string, code: string) {
    if (!email || !code) {
      throw new BadRequestException('Missing email or code');
    }
    const result = await this.users.validateAndConsumeCode(email, code);
    if (!result.ok) {
      if (result.reason === 'no_user') {
        throw new BadRequestException('User not found');
      }
      throw new BadRequestException('Invalid or expired code');
    }
    return { ok: true };
  }

  async completeProfile(email: string, username: string, password: string) {
    if (!email || !username || !password) {
      throw new BadRequestException('Missing data');
    }
    const updated = await this.users.setUsernameAndPassword(
      email,
      username,
      password,
    );
    if (!updated) {
      throw new BadRequestException('User not verified or not found');
    }
    return updated;
  }

  async login(email: string, password: string) {
    const user = await this.users.findUserByEmail(email || '');
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const bcrypt = await import('bcryptjs');
    const ok = await bcrypt.compare(password || '', user.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async forgotPassword(email: string) {
    if (!email) throw new BadRequestException('Missing email');

    const rawToken = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const user = await this.users.createPasswordResetToken(
      email,
      rawToken,
      expiresAt,
    );
    if (!user) {
      // เพื่อไม่ให้บอกว่า email นี้ไม่มีอยู่
      return { ok: true };
    }

    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset?token=${encodeURIComponent(
      rawToken,
    )}`;

    await this.email.sendEmail({
      to: email,
      subject: 'Password reset',
      text: `Click here to reset your password: ${resetLink}`,
      html: `<p>Click here to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
    });

    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('Missing token or password');
    }
    const user = await this.users.consumePasswordResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }
    await this.users.setPassword(user.id, newPassword);
    return { ok: true };
  }

  // GOOGLE WEB FLOW

  getGoogleAuthUrl() {
    if (!this.oauth2ClientWeb) {
      throw new BadRequestException('Google OAuth not configured');
    }
    const callbackUri = this.config.get<string>('GOOGLE_CALLBACK_URI');
    const scopes = ['openid', 'email', 'profile'];

    const url = this.oauth2ClientWeb.generateAuthUrl({
      redirect_uri: callbackUri,
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
    });
    return url;
  }

  async handleGoogleCallback(code: string) {
    if (!this.oauth2ClientWeb) {
      throw new BadRequestException('Google OAuth not configured');
    }

    const callbackUri = this.config.get<string>('GOOGLE_CALLBACK_URI');

    const { tokens } = await this.oauth2ClientWeb.getToken({
      code,
      redirect_uri: callbackUri,
    });
    this.oauth2ClientWeb.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: this.oauth2ClientWeb,
      version: 'v2',
    });
    const { data: info } = await oauth2.userinfo.v2.me.get();

    const email = info.email!;
    const user = await this.users.setOAuthUser({
      email,
      provider: 'google',
      oauthId: info.id!,
      pictureUrl: info.picture || undefined,
      name: info.name || undefined,
    });

    return user;
  }

  async statusFromToken(token?: string) {
    if (!token) return { authenticated: false };
    try {
      const payload = jwt.verify(token, this.jwtSecret) as any;
      return {
        authenticated: true,
        id: payload.id,
        role: payload.role || 'user',
      };
    } catch {
      return { authenticated: false };
    }
  }

  private generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
