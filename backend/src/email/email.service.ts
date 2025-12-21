import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

// ต้องมี dependency: nodemailer
const MailComposer = require('nodemailer/lib/mail-composer');

type SendEmailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
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
    const senderEnv = (this.config.get<string>('SENDER_EMAIL') || '').trim();
    this.senderEmail = senderEnv || null;

    if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
      this.logger.error(
        '[MAIL] Missing Gmail OAuth env. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, REFRESH_TOKEN',
      );
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  private async ensureSenderEmail(): Promise<string> {
    if (this.senderEmail) return this.senderEmail;

    if (!this.gmail) {
      throw new ServiceUnavailableException('Email service is not configured.');
    }

    try {
      const profile = await this.gmail.users.getProfile({ userId: 'me' });
      const email = profile?.data?.emailAddress;
      if (!email) throw new Error('Missing emailAddress from Gmail profile');

      this.senderEmail = String(email).trim();
      return this.senderEmail;
    } catch (err: any) {
      this.logger.error(`[MAIL] Fallback failed: ${err?.message}`);
      throw new ServiceUnavailableException('Email sender is not available.');
    }
  }

  private async buildRawMessage(input: SendEmailInput): Promise<string> {
    const fromEmail = await this.ensureSenderEmail();
    const fromName = this.senderName;

    // ปรับปรุง: ตรวจสอบและสร้าง Text fallback ให้สมบูรณ์ (Outlook ชอบแบบที่มีทั้ง Text และ HTML)
    const textContent = input.text || (input.html ? input.html.replace(/<[^>]+>/g, ' ') : '');

    const mailOptions: any = {
      // ปรับปรุง: ใช้รูปแบบ From ที่ Outlook ยอมรับง่ายขึ้น และต้องตรงกับเจ้าของ Token
      from: `${fromName} <${fromEmail}>`,
      to: input.to,
      subject: input.subject,
      text: textContent,
      html: input.html,
    };

    if (input.cc) mailOptions.cc = input.cc;
    if (input.bcc) mailOptions.bcc = input.bcc;
    if (input.replyTo) mailOptions.replyTo = input.replyTo;

    const mail = new MailComposer(mailOptions);

    const message: Buffer = await new Promise((resolve, reject) => {
      mail.compile().build((err: any, msg: Buffer) => {
        if (err) reject(err);
        else resolve(msg);
      });
    });

    return message
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  async sendEmail(input: SendEmailInput): Promise<{ id: string }> {
    // ปรับปรุง: เพิ่มการเช็คตัวแปร EMAIL_DISABLE จาก Config
    const isEmailDisabled = this.config.get<boolean>('EMAIL_DISABLE');
    if (isEmailDisabled) {
      this.logger.warn(`[MAIL] Email sending is disabled via EMAIL_DISABLE env.`);
      return { id: 'disabled' };
    }

    if (!this.gmail) {
      throw new ServiceUnavailableException('Email service not configured.');
    }

    try {
      const raw = await this.buildRawMessage(input);

      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      const id = String(res?.data?.id || '');
      this.logger.log(`[MAIL] Sent successfully: ${input.to}, ID: ${id}`);

      return { id };
    } catch (err: any) {
      const msg = err?.response?.data || err?.message || String(err);
      this.logger.error(`[MAIL] Send failed: ${JSON.stringify(msg)}`);
      throw new ServiceUnavailableException('Failed to send email via Gmail API.');
    }
  }
}