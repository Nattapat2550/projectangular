import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

// MailComposer (nodemailer) ใช้สร้าง MIME email ให้ Gmail API ส่งได้
// ต้องมี dependency: nodemailer
// npm i nodemailer
// (ถ้ามีอยู่แล้วไม่ต้องลงเพิ่ม)
const MailComposer = require('nodemailer/lib/mail-composer');

type SendEmailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;

  // optional
  cc?: string;
  bcc?: string;
  replyTo?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private oauth2Client: any;
  private gmail: any;

  private senderEmail: string | null = null;
  private senderName: string | null = null;

  constructor(private readonly config: ConfigService) {
    const clientId = (this.config.get<string>('GOOGLE_CLIENT_ID') || '').trim();
    const clientSecret = (this.config.get<string>('GOOGLE_CLIENT_SECRET') || '').trim();
    const redirectUri = (this.config.get<string>('GOOGLE_REDIRECT_URI') || '').trim();
    const refreshToken = (this.config.get<string>('REFRESH_TOKEN') || '').trim();

    this.senderName = (this.config.get<string>('SENDER_NAME') || 'MyApp').trim();

    // ✅ สาเหตุหลักที่ Outlook ไม่รับ: From ว่าง/ผิด หรือ From ไม่ตรง Gmail ที่ authorize
    // ถ้ามี SENDER_EMAIL ใช้ตัวนี้ (ต้องเป็น Gmail เดียวกับ refresh token)
    const senderEnv = (this.config.get<string>('SENDER_EMAIL') || '').trim();
    this.senderEmail = senderEnv || null;

    if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
      // ไม่ throw ทันที เพราะบางคนอาจไม่ได้ใช้ email ทุก flow
      this.logger.error(
        '[MAIL] Missing Gmail OAuth env. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, REFRESH_TOKEN',
      );
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * ดึงอีเมลของบัญชี Gmail ที่ authorize จริง เพื่อใช้เป็น fallback From
   * ช่วยให้ Outlook deliver ดีขึ้นมาก เพราะ From ไม่ spoof
   */
  private async ensureSenderEmail(): Promise<string> {
    if (this.senderEmail) return this.senderEmail;

    if (!this.gmail) {
      throw new ServiceUnavailableException(
        'Email service is not configured (missing Gmail OAuth env).',
      );
    }

    try {
      const profile = await this.gmail.users.getProfile({ userId: 'me' });
      const email = profile?.data?.emailAddress;
      if (!email) throw new Error('Missing emailAddress from Gmail profile');

      this.senderEmail = String(email).trim();
      this.logger.log(`[MAIL] Using Gmail profile sender: ${this.senderEmail}`);
      return this.senderEmail;
    } catch (err: any) {
      this.logger.error(
        `[MAIL] Failed to read Gmail profile for sender fallback: ${err?.message || err}`,
      );
      throw new ServiceUnavailableException(
        'Email sender is not available. Please set SENDER_EMAIL to the Gmail address used to create REFRESH_TOKEN.',
      );
    }
  }

  /**
   * สร้าง raw RFC822 email -> base64url สำหรับ Gmail API
   */
  private async buildRawMessage(input: SendEmailInput): Promise<string> {
    const fromEmail = await this.ensureSenderEmail();
    const fromName = (this.senderName || 'MyApp').trim();

    // ✅ ช่วย deliver โดยเฉพาะ Outlook:
    // - มีทั้ง text และ html
    // - From เป็นบัญชีจริง ไม่ spoof
    const text =
      input.text ||
      (input.html
        ? input.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        : '');

    const mail = new MailComposer({
      from: `${fromName} <${fromEmail}>`,
      to: input.to,
      cc: input.cc,
      bcc: input.bcc,
      replyTo: input.replyTo || fromEmail,
      subject: input.subject,
      text,
      html: input.html || (text ? `<p>${this.escapeHtml(text)}</p>` : undefined),
      headers: {
        'X-Mailer': 'projectangular1-nest',
      },
    });

    const message: Buffer = await new Promise((resolve, reject) => {
      mail.compile().build((err: any, msg: Buffer) => {
        if (err) reject(err);
        else resolve(msg);
      });
    });

    // Gmail API wants base64url
    return message
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  private escapeHtml(s: string) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * ส่งอีเมลด้วย Gmail API
   * คืน messageId เพื่อ debug ได้ง่ายว่ามัน “ส่งออกจาก Gmail แล้ว”
   */
  async sendEmail(input: SendEmailInput): Promise<{ id: string }> {
    if (!this.gmail) {
      throw new ServiceUnavailableException(
        'Email service is not configured (missing Gmail OAuth env).',
      );
    }

    if (!input?.to || !input?.subject) {
      throw new ServiceUnavailableException('Email payload missing "to" or "subject".');
    }

    try {
      const raw = await this.buildRawMessage(input);

      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      const id = String(res?.data?.id || '');
      this.logger.log(
        `[MAIL] Sent: to=${input.to} subject="${input.subject}" id=${id || '(no-id)'}`,
      );

      return { id };
    } catch (err: any) {
      const msg = err?.response?.data || err?.message || String(err);
      this.logger.error(`[MAIL] Send failed: ${msg}`);

      // ให้ error ชัด ๆ เพื่อแก้เร็ว
      throw new ServiceUnavailableException(
        'Unable to send email right now. Please verify Gmail OAuth env and SENDER_EMAIL, then try again.',
      );
    }
  }
}
