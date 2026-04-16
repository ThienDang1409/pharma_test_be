import nodemailer, { type Transporter } from 'nodemailer';
import config from '../../config';
import { logger } from '../../common/logger';
import {
  ContactSubmitMeta,
  ContactSubmitResultDto,
  SubmitContactDto,
} from './contact.dto';

interface ContactPayload {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  sourcePage?: string;
  language: 'vi' | 'en';
}

export class ContactService {
  private readonly receiverEmail = config.contactReceiverEmail || 'trung.nt@vietanh.vn';

  private isSmtpConfigured(): boolean {
    return Boolean(config.smtpUser && config.smtpPass);
  }

  private createTransporter(): Transporter {
    return nodemailer.createTransport({
      host: config.smtpHost || 'smtp.gmail.com',
      port: config.smtpPort || 587,
      secure: config.smtpSecure || false,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  }

  private sanitize(value?: string): string {
    if (!value) return '';
    return value.replace(/[<>]/g, '').trim();
  }

  private normalizePayload(dto: SubmitContactDto): ContactPayload {
    const language = dto.language === 'en' ? 'en' : 'vi';

    return {
      fullName: this.sanitize(dto.fullName),
      email: this.sanitize(dto.email),
      phone: this.sanitize(dto.phone) || undefined,
      company: this.sanitize(dto.company) || undefined,
      subject:
        this.sanitize(dto.subject) ||
        (language === 'en' ? 'Contact request from website' : 'Yeu cau lien he tu website'),
      message: this.sanitize(dto.message),
      sourcePage: this.sanitize(dto.sourcePage) || undefined,
      language,
    };
  }

  private buildHtml(payload: ContactPayload, meta: ContactSubmitMeta): string {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">New Contact Request</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 720px;">
          <tbody>
            <tr><td style="padding: 6px 10px; border: 1px solid #e2e8f0;"><strong>Full Name</strong></td><td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${payload.fullName}</td></tr>
            <tr><td style="padding: 6px 10px; border: 1px solid #e2e8f0;"><strong>Email</strong></td><td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${payload.email}</td></tr>
            <tr><td style="padding: 6px 10px; border: 1px solid #e2e8f0;"><strong>Phone</strong></td><td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${payload.phone || '-'}</td></tr>
            <tr><td style="padding: 6px 10px; border: 1px solid #e2e8f0;"><strong>Company</strong></td><td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${payload.company || '-'}</td></tr>
            <tr><td style="padding: 6px 10px; border: 1px solid #e2e8f0;"><strong>Subject</strong></td><td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${payload.subject}</td></tr>
            <tr><td style="padding: 6px 10px; border: 1px solid #e2e8f0;"><strong>Language</strong></td><td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${payload.language}</td></tr>
            <tr><td style="padding: 6px 10px; border: 1px solid #e2e8f0;"><strong>Source Page</strong></td><td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${payload.sourcePage || '-'}</td></tr>
            <tr><td style="padding: 6px 10px; border: 1px solid #e2e8f0;"><strong>IP Address</strong></td><td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${meta.ipAddress || '-'}</td></tr>
            <tr><td style="padding: 6px 10px; border: 1px solid #e2e8f0;"><strong>User Agent</strong></td><td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${meta.userAgent || '-'}</td></tr>
            <tr><td style="padding: 6px 10px; border: 1px solid #e2e8f0;"><strong>Submitted At</strong></td><td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${meta.submittedAt.toISOString()}</td></tr>
          </tbody>
        </table>
        <div style="margin-top: 16px; padding: 12px; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 6px; white-space: pre-wrap;">${payload.message}</div>
      </div>
    `;
  }

  private buildText(payload: ContactPayload, meta: ContactSubmitMeta): string {
    return [
      'New Contact Request',
      '',
      `Full Name: ${payload.fullName}`,
      `Email: ${payload.email}`,
      `Phone: ${payload.phone || '-'}`,
      `Company: ${payload.company || '-'}`,
      `Subject: ${payload.subject}`,
      `Language: ${payload.language}`,
      `Source Page: ${payload.sourcePage || '-'}`,
      `IP Address: ${meta.ipAddress || '-'}`,
      `User Agent: ${meta.userAgent || '-'}`,
      `Submitted At: ${meta.submittedAt.toISOString()}`,
      '',
      'Message:',
      payload.message,
    ].join('\n');
  }

  async submitContact(
    dto: SubmitContactDto,
    meta: ContactSubmitMeta
  ): Promise<ContactSubmitResultDto> {
    const payload = this.normalizePayload(dto);

    if (!this.isSmtpConfigured()) {
      logger.warn('[Contact] SMTP is not configured. Contact request is accepted but email is not delivered.');
      logger.info(
        `[Contact] queued request for ${this.receiverEmail}: ${JSON.stringify({
          fullName: payload.fullName,
          email: payload.email,
          subject: payload.subject,
          sourcePage: payload.sourcePage,
        })}`
      );

      return {
        recipient: this.receiverEmail,
        delivered: false,
        queued: true,
      };
    }

    const transporter = this.createTransporter();

    const mailResult = await transporter.sendMail({
      from: `"${config.smtpFromName || 'VietAnh Instruments Contact Form'}" <${config.smtpUser}>`,
      to: this.receiverEmail,
      replyTo: payload.email,
      subject: `[VietAnh Instruments Website] ${payload.subject}`,
      text: this.buildText(payload, meta),
      html: this.buildHtml(payload, meta),
    });

    logger.info(`[Contact] mail delivered to ${this.receiverEmail} (messageId=${mailResult.messageId})`);

    return {
      recipient: this.receiverEmail,
      delivered: true,
      queued: false,
      messageId: mailResult.messageId,
    };
  }
}
