import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

// ใช้ require ตามแบบ test12 เพื่อความชัวร์เรื่อง library
const MailComposer = require('nodemailer/lib/mail-composer');

// Interface input คงไว้เพื่อให้ NestJS เรียกใช้ได้เหมือนเดิม
export type SendEmailInput = {
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
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI');
    const refreshToken = this.config.get<string>('REFRESH_TOKEN');

    // เช็คว่า Config ครบไหม ถ้าไม่ครบให้ Log เตือน
    if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
      this.logger.error('[MAIL] Missing Google OAuth configuration in .env');
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async sendEmail(input: SendEmailInput): Promise<{ id: string }> {
    // 1. ตรวจสอบว่าปิด Email ไว้หรือไม่ (สำคัญมาก! เช็คไฟล์ .env ดีๆ)
    // ใน env.config.ts คุณแปลงเป็น boolean แล้ว ดังนั้นเรียกใช้ได้เลย
    if (this.config.get('EMAIL_DISABLE') === true) {
      this.logger.warn('[MAIL] Email sending is DISABLED in .env');
      return { id: 'disabled' };
    }

    if (!this.gmail) {
      throw new ServiceUnavailableException('Gmail service not initialized (Check .env)');
    }

    const senderEmail = this.config.get<string>('SENDER_EMAIL');
    if (!senderEmail) {
      throw new ServiceUnavailableException('SENDER_EMAIL is missing in .env');
    }

    try {
      // 2. สร้าง Mail Options แบบเดียวกับ test12 เป๊ะๆ
      // Outlook ชอบให้มี html ด้วย ถ้าไม่มีให้ใช้ text แทน
      const mailOptions = {
        to: input.to,
        subject: input.subject,
        text: input.text || '', // บังคับมี text
        html: input.html || input.text || '', // ถ้ามี html ให้ใส่ ถ้าไม่มีให้เอา text มาใส่แทน
        from: senderEmail, // ใส่ Email ตรงๆ เลย ไม่ต้องมีชื่อ <...>
      };

      // 3. Compile Message (Logic เดียวกับ test12)
      const mail = new MailComposer(mailOptions);
      const message = await new Promise<Buffer>((resolve, reject) => {
        mail.compile().build((err: any, msg: Buffer) => {
          if (err) reject(err);
          else resolve(msg);
        });
      });

      // 4. Encode base64url (Logic เดียวกับ test12)
      const encodedMessage = message
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // 5. ส่งผ่าน Gmail API
      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      this.logger.log(`[MAIL] Sent successfully to: ${input.to} (ID: ${res.data.id})`);
      return { id: res.data.id };

    } catch (err: any) {
      this.logger.error(`[MAIL] Failed to send: ${err.message}`, err.stack);
      // โยน Error ออกไปเพื่อให้ Controller รู้ว่าส่งไม่ผ่าน
      throw new ServiceUnavailableException(`Email failed: ${err.message}`);
    }
  }
}