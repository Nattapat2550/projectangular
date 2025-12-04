import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from './database.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { Request, Response } from 'express';

interface JwtPayload {
  id: number;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService) {}

  // ---------- helpers ----------
  private signToken(user: { id: number; role: string }) {
    const secret = process.env.JWT_SECRET || 'secret';
    return jwt.sign(
      { id: user.id, role: user.role } as JwtPayload,
      secret,
      { expiresIn: '30d' }
    );
  }

  async requireUser(req: Request) {
    const token = (req as any).cookies?.token;
    if (!token) throw new UnauthorizedException('Not authenticated');
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
      const { rows } = await this.db.query('SELECT * FROM users WHERE id=$1', [payload.id]);
      const user = rows[0];
      if (!user) throw new UnauthorizedException('User not found');
      return user;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async requireAdmin(req: Request) {
    const user = await this.requireUser(req);
    if (user.role !== 'admin') throw new UnauthorizedException('Admin only');
    return user;
  }

  private async sendEmail(options: { to: string; subject: string; text?: string; html?: string }) {
    if (String(process.env.EMAIL_DISABLE).toLowerCase() === 'true') {
      console.log('[EMAIL_DISABLED]', options);
      return;
    }

    const user = process.env.SENDER_EMAIL;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.REFRESH_TOKEN;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user,
        clientId,
        clientSecret,
        refreshToken
      }
    } as any);

    await transporter.sendMail({
      from: user,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });
  }

  // ---------- business logic ----------

  async register(email: string) {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      throw new BadRequestException('Invalid email');
    }

    // Create user if not exists
    const { rows: existing } = await this.db.query('SELECT * FROM users WHERE email=$1', [email]);
    let user = existing[0];
    if (!user) {
      const result = await this.db.query(
        'INSERT INTO users (email, is_email_verified) VALUES ($1, FALSE) RETURNING *',
        [email]
      );
      user = result.rows[0];
    }

    // generate code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await this.db.query(
      `INSERT INTO email_verification_codes (email, code, expires_at)
       VALUES ($1,$2,$3)
       ON CONFLICT (email) DO UPDATE SET code=$2, expires_at=$3`,
      [email, code, expires]
    );

    await this.sendEmail({
      to: email,
      subject: 'Your verification code',
      text: `Your code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your code is <b>${code}</b>. It expires in 10 minutes.</p>`
    });

    return { ok: true };
  }

  async verifyCode(email: string, code: string) {
    const { rows } = await this.db.query(
      'SELECT * FROM email_verification_codes WHERE email=$1',
      [email]
    );
    const rec = rows[0];
    if (!rec || rec.code !== code) {
      throw new BadRequestException('Invalid code');
    }
    if (new Date(rec.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('Code expired');
    }

    await this.db.query('UPDATE users SET is_email_verified=TRUE WHERE email=$1', [email]);
    await this.db.query('DELETE FROM email_verification_codes WHERE email=$1', [email]);

    return { ok: true };
  }

  async completeProfile(email: string, username: string, password: string) {
    const { rows } = await this.db.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = rows[0];
    if (!user) throw new BadRequestException('User not found');
    if (!user.is_email_verified) throw new BadRequestException('Email not verified');
    if (!username || username.length < 2) throw new BadRequestException('Invalid username');
    if (!password || password.length < 6) throw new BadRequestException('Password too short');

    const hash = await bcrypt.hash(password, 10);
    const result = await this.db.query(
      'UPDATE users SET username=$1, password_hash=$2 WHERE email=$3 RETURNING *',
      [username, hash, email]
    );
    return result.rows[0];
  }

  async login(email: string, password: string, remember: boolean, res: Response) {
    const { rows } = await this.db.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = rows[0];
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const token = this.signToken(user);
    const maxAge = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      profile_picture_url: user.profile_picture_url
    };
  }

  async status(req: Request) {
    const token = (req as any).cookies?.token;
    if (!token) return { authenticated: false };

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
      return {
        authenticated: true,
        id: payload.id,
        role: payload.role || 'user'
      };
    } catch {
      return { authenticated: false };
    }
  }

  async logout(res: Response) {
    res.clearCookie('token');
    return { ok: true };
  }

  async forgotPassword(email: string) {
    const { rows } = await this.db.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = rows[0];
    if (!user) {
      // ไม่บอกว่าไม่มี user เพื่อความปลอดภัย
      return { ok: true };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.db.query(
      `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, used)
       VALUES ($1,$2,$3,FALSE)
       ON CONFLICT (token_hash) DO UPDATE SET user_id=$2, expires_at=$3, used=FALSE`,
      [tokenHash, user.id, expires]
    );

    const frontend = process.env.FRONTEND_URL || 'http://localhost:5500';
    const link = `${frontend}/reset.html?token=${encodeURIComponent(rawToken)}`;

    await this.sendEmail({
      to: email,
      subject: 'Password reset',
      text: `Click this link to reset your password: ${link}`,
      html: `<p>Click <a href="${link}">here</a> to reset your password.</p>`
    });

    return { ok: true };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    if (!rawToken) throw new BadRequestException('Missing token');
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password too short');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const { rows } = await this.db.query(
      'SELECT * FROM password_reset_tokens WHERE token_hash=$1',
      [tokenHash]
    );
    const rec = rows[0];
    if (!rec || rec.used) throw new BadRequestException('Invalid token');
    if (new Date(rec.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('Token expired');
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await this.db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, rec.user_id]);
    await this.db.query(
      'UPDATE password_reset_tokens SET used=TRUE WHERE token_hash=$1',
      [tokenHash]
    );

    return { ok: true };
  }
}
