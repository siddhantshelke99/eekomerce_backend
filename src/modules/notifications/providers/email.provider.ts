import nodemailer, { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailProvider {
  private static instance: EmailProvider;
  private transporter: Transporter;

  private constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env['SMTP_HOST'] || 'smtp.ethereal.email',
      port: parseInt(process.env['SMTP_PORT'] || '587', 10),
      secure: process.env['SMTP_SECURE'] === 'true',
      auth: {
        user: process.env['SMTP_USER'] || 'ethereal_user',
        pass: process.env['SMTP_PASS'] || 'ethereal_pass',
      },
    });
  }

  public static getInstance(): EmailProvider {
    if (!EmailProvider.instance) {
      EmailProvider.instance = new EmailProvider();
    }
    return EmailProvider.instance;
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: '"NearrBuy" <no-reply@nearrbuy.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`✉️ [EmailProvider] Message sent to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ [EmailProvider] Error sending email:', error);
      throw error;
    }
  }
}
