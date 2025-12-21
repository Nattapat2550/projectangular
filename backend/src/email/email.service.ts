import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

// ตรวจสอบว่าได้ลง nodemailer หรือยัง: npm i nodemailer
const MailComposer = require('nodemailer/lib/mail-composer');

type SendEmailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private oauth2Client: any;
  private gmail: any;

  constructor(private readonly config: ConfigService) {
    // ดึงค่า Config มาเตรียมไว้
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI');
    const refreshToken = this.config.get<string>('REFRESH_TOKEN');

    if (clientId && clientSecret && redirectUri && refreshToken) {
      this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    }
  }

  async sendEmail(input: SendEmailInput): Promise<{ id: string }> {
    // 1. เช็คว่าปิดการส่งเมลไว้หรือไม่
    const isEmailDisabled = this.config.get<boolean>('EMAIL_DISABLE');
    if (isEmailDisabled) {
      this.logger.warn('[MAIL] Email is disabled in .env');
      return { id: 'disabled' };
    }

    if (!this.gmail) {
      throw new ServiceUnavailableException('Gmail API not configured');
    }

    try {
      // 2. ตั้งค่า Mail ให้เหมือน test12 มากที่สุด
      const mailOptions = {
        to: input.to,
        subject: input.subject,
        text: input.text || '',
        html: input.html, // Outlook จะรับเมลได้ดีขึ้นถ้ามีทั้ง text และ html
        from: this.config.get<string>('SENDER_EMAIL'), // ใช้จาก .env ตรงๆ เหมือน test12
      };

      const mail = new MailComposer(mailOptions);
      const message: Buffer = await new Promise((resolve, reject) => {
        mail.compile().build((err: any, msg: Buffer) => {
          if (err) reject(err);
          else resolve(msg);
        });
      });

      // 3. Encode และส่งผ่าน Gmail API
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage },
      });

      this.logger.log(`[MAIL] Sent to ${input.to} successfully`);
      return { id: res.data.id };

    } catch (err: any) {
      this.logger.error(`[MAIL] Error: ${err.message}`);
      throw err;
    }
  }
}