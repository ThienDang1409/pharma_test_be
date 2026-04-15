export interface SubmitContactDto {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  sourcePage?: string;
  language?: 'vi' | 'en';
}

export interface ContactSubmitMeta {
  ipAddress?: string;
  userAgent?: string;
  submittedAt: Date;
}

export interface ContactSubmitResultDto {
  recipient: string;
  delivered: boolean;
  queued: boolean;
  messageId?: string;
}
