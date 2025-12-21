import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

// ใช้ MailComposer แบบเดียวกับ logins/backend/utils/gmail.js
const MailComposer = require('nodemailer/lib/mail-composer');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private gmail: any;

  constructor(private readonly config: ConfigService) {
    // 1. ดึง Config มาเตรียมไว้
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI');
    const refreshToken = this.config.get<string>('REFRESH_TOKEN');

    // ตรวจสอบว่ามีค่าครบไหม
    if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
      this.logger.error('[MAIL] Missing OAuth Config in .env');
      return;
    }

    // 2. สร้าง OAuth2 Client
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async sendEmail(input: { to: string; subject: string; text: string }) {
    try {
      // ตรวจสอบการปิดระบบเมล
      const isEmailDisabled = this.config.get('EMAIL_DISABLE') === 'true' || this.config.get('EMAIL_DISABLE') === true;
      if (isEmailDisabled) {
        this.logger.warn('[MAIL] Sending is disabled via .env');
        return;
      }

      // ดึง Sender Email จาก .env (ต้องตรงกับเจ้าของ Refresh Token)
      const sender = this.config.get<string>('SENDER_EMAIL');
      
      if (!input.to || !input.subject || !input.text) {
        throw new Error("sendEmail requires (to, subject, text)");
      }

      if (!this.gmail) {
        throw new Error("Gmail service is not initialized");
      }

      // 3. สร้าง MailComposer (Text ล้วน ไม่มี HTML เพื่อลดโอกาส Spam)
      const mail = new MailComposer({
        to: input.to,
        subject: input.subject,
        text: input.text,
        from: sender, // ใส่ Email โดดๆ ไม่ต้องใส่ชื่อ <email>
      });

      // 4. Compile & Build
      const message = await new Promise<Buffer>((resolve, reject) => {
        mail.compile().build((err, msg) => {
          if (err) reject(err);
          else resolve(msg);
        });
      });

      // 5. Encode Base64
      const encoded = message
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // 6. ส่งผ่าน Gmail API
      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encoded },
      });

      this.logger.log(`[MAIL] Sent successfully to=${input.to}, ID=${res.data.id}`);
      return res.data;

    } catch (error: any) {
      this.logger.error(`[MAIL] Failed to send email: ${error.message}`);
      // สำคัญ: ต้อง throw error เพื่อให้ AuthService รู้ว่าส่งไม่ผ่าน
      throw new ServiceUnavailableException(`Email failed: ${error.message}`);
    }
  }
}