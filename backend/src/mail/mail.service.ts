// backend/src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly emailDisabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.emailDisabled = this.config.get<boolean>('emailDisable') ?? true;

    if (!this.emailDisabled) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: this.config.get<string>('gmail.senderEmail'),
          clientId: this.config.get<string>('google.clientId'),
          clientSecret: this.config.get<string>('google.clientSecret'),
          refreshToken: this.config.get<string>('gmail.refreshToken'),
        },
      });
    }
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    if (this.emailDisabled) {
      this.logger.debug(`EMAIL_DISABLE is true, skip sending mail to ${to}`);
      return;
    }

    if (!this.transporter) {
      this.logger.error('Mail transporter is not initialized');
      return;
    }

    await this.transporter.sendMail({
      from: this.config.get<string>('gmail.senderEmail'),
      to,
      subject,
      html,
    });
  }
}
