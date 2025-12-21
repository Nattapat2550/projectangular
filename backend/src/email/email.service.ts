import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, gmail_v1 } from 'googleapis';
import { randomUUID } from 'crypto';

// ใช้ MailComposer แบบเดียวกับ docker
const MailComposer = require('nodemailer/lib/mail-composer');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private gmail?: gmail_v1.Gmail;
  private resolvedSender?: string;

  constructor(private readonly config: ConfigService) {
    const clientId = (this.config.get<string>('GOOGLE_CLIENT_ID') || '').trim();
    const clientSecret = (this.config.get<string>('GOOGLE_CLIENT_SECRET') || '').trim();
    const redirectUri = (this.config.get<string>('GOOGLE_REDIRECT_URI') || '').trim();
    const refreshToken = (this.config.get<string>('REFRESH_TOKEN') || '').trim();

    if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
      this.logger.error('[MAIL] Missing OAuth Config in .env (GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI/REFRESH_TOKEN)');
      return;
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  private async getSenderEmail(): Promise<string> {
    if (this.resolvedSender) return this.resolvedSender;

    const fromEnv = (this.config.get<string>('SENDER_EMAIL') || '').trim();
    if (fromEnv && /^\S+@\S+\.\S+$/.test(fromEnv)) {
      this.resolvedSender = fromEnv;
      return fromEnv;
    }

    if (!this.gmail) throw new Error('Gmail service is not initialized');

    // fallback: ดึง email เจ้าของ refresh token
    const profile = await this.gmail.users.getProfile({ userId: 'me' });
    const addr = (profile.data.emailAddress || '').trim();
    if (!addr) throw new Error('Unable to resolve sender email. Please set SENDER_EMAIL in env.');

    this.resolvedSender = addr;
    return addr;
  }

  async sendEmail(input: { to: string; subject: string; text: string }) {
    try {
      // ✅ ถ้า disable: ต้อง error ชัด (ไม่ return เงียบ ๆ)
      const disabled = this.config.get<boolean>('EMAIL_DISABLE') === true;
      if (disabled) {
        throw new ServiceUnavailableException('Email sending is disabled (EMAIL_DISABLE=true).');
      }

      if (!this.gmail) throw new Error('Gmail service is not initialized');

      const to = (input?.to || '').trim();
      const subject = (input?.subject || '').trim();
      const text = (input?.text || '').trim();
      if (!to || !subject || !text) throw new Error('sendEmail requires (to, subject, text)');

      const sender = await this.getSenderEmail();

      const refId = (() => {
        try {
          return randomUUID();
        } catch {
          return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        }
      })();

      const mail = new MailComposer({
        to,
        subject,
        text,
        from: sender,
        replyTo: sender,
        headers: {
          'X-Entity-Ref-ID': refId,
          'X-Mailer': 'projectangular1',
        },
      });

      const message: Buffer = await new Promise((resolve, reject) => {
        mail.compile().build((err: any, msg: Buffer) => (err ? reject(err) : resolve(msg)));
      });

      const encoded = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encoded },
      });

      this.logger.log(`[MAIL] Sent to=${to}, id=${res.data.id}, ref=${refId}`);
      return res.data;
    } catch (error: any) {
      const msg = error?.message || String(error);
      this.logger.error(`[MAIL] Failed to send email: ${msg}`);
      throw error instanceof ServiceUnavailableException
        ? error
        : new ServiceUnavailableException(`Email failed: ${msg}`);
    }
  }
}
