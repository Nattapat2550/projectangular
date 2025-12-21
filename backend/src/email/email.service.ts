import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

// เรียกใช้ nodemailer แบบเดียวกับ logins/backend/utils/gmail.js
const MailComposer = require('nodemailer/lib/mail-composer');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private gmail: any;

  constructor(private readonly config: ConfigService) {
    // 1. ดึง Config แบบเดียวกับ logins
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI');
    const refreshToken = this.config.get<string>('REFRESH_TOKEN');

    // ตรวจสอบค่า (ป้องกัน error ตอน runtime)
    if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
      this.logger.error('[MAIL] Missing OAuth Config in .env');
      return;
    }

    // 2. สร้าง OAuth2 Client (Logic เดียวกับ logins)
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  // ปรับ signature ให้รองรับการเรียกใช้แบบเดิมของ Project Angular (รับ Object)
  // แต่ไส้ในทำงานเหมือน logins/utils/gmail.js
  async sendEmail(input: { to: string; subject: string; text?: string; html?: string }) {
    try {
      // เช็คว่าปิดเมลไว้หรือไม่
      const isEmailDisabled = this.config.get('EMAIL_DISABLE') === 'true' || this.config.get('EMAIL_DISABLE') === true;
      if (isEmailDisabled) {
        this.logger.warn('[MAIL] Sending is disabled via .env');
        return;
      }

      const sender = this.config.get<string>('SENDER_EMAIL');
      
      // Validation แบบ logins
      if (!input.to || !input.subject) {
        throw new Error("sendEmail requires (to, subject)");
      }

      if (!this.gmail) {
        throw new Error("Gmail service is not initialized");
      }

      // 3. สร้าง MailComposer (Copy Logic มาจาก logins เป๊ะๆ)
      // *สำคัญ*: Outlook ชอบ Text ธรรมดา ถ้ามี HTML ก็ใส่ไป แต่ต้องมี Text เป็น Backup
      const mail = new MailComposer({
        to: input.to,
        subject: input.subject,
        text: input.text || input.html || 'No content', // บังคับมี Text
        html: input.html, // ใส่ HTML ถ้ามี
        from: sender, // ใส่แค่ Email โดดๆ แบบ logins (ไม่เอาชื่อ <email>)
      });

      // 4. Compile & Build (Logic เดียวกับ logins)
      const message = await new Promise<Buffer>((resolve, reject) => {
        mail.compile().build((err, msg) => {
          if (err) reject(err);
          else resolve(msg);
        });
      });

      // 5. Encode Base64 (Logic เดียวกับ logins)
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
      // ไม่ throw error เพื่อป้องกัน App Crash ถ้าส่งเมลไม่ผ่าน (ตามสไตล์ NestJS บาง flow)
      // แต่ถ้าอยากให้ Frontend รู้ว่าพัง ให้ uncomment บรรทัดล่าง
      // throw error; 
    }
  }
}