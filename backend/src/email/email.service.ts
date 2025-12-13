import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import MailComposer = require('nodemailer/lib/mail-composer');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private gmail: any;
  private emailDisabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.emailDisabled = this.config.get<boolean>('EMAIL_DISABLE') || false;

    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI');
    const refreshToken = this.config.get<string>('REFRESH_TOKEN');

    if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
      this.logger.warn('Google OAuth not fully configured, email may not work.');
      this.emailDisabled = true;
      return;
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void> {
    if (this.emailDisabled) {
      this.logger.log(
        `EMAIL_DISABLE=true, skip sending email to ${options.to} (${options.subject})`,
      );
      return;
    }
    const from = this.config.get<string>('SENDER_EMAIL');
    const mail = new (MailComposer as any)({
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      from,
    });

    const message: Buffer = await new Promise((resolve, reject) => {
      mail.compile().build((err: any, msg: Buffer) =>
        err ? reject(err) : resolve(msg),
      );
    });

    const encoded = message
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

    await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encoded },
    });
  }
}
