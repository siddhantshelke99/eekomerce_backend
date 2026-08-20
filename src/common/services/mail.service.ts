import nodemailer, { Transporter } from 'nodemailer';

export class MailService {
  private transporter: Transporter | null = null;

  constructor() {
    if (process.env['SMTP_HOST'] && process.env['SMTP_USER']) {
      this.transporter = nodemailer.createTransport({
        host: process.env['SMTP_HOST'],
        port: parseInt(process.env['SMTP_PORT'] || '587', 10),
        secure: process.env['SMTP_SECURE'] === 'true',
        auth: {
          user: process.env['SMTP_USER'],
          pass: process.env['SMTP_PASS'] || '',
        },
      });
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.log(`✉️ [MailService SIMULATION] Welcome Email Sent To: ${to} | Name: ${name}`);
        return true;
      }

      await this.transporter.sendMail({
        from: '"NearrBuy" <no-reply@nearrbuy.com>',
        to,
        subject: 'Welcome to NearrBuy — Shop Near, Save More',
        html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Welcome to NearrBuy, ${name}!</h2><p>Shop Near, Save More.</p></div>`,
      });
      return true;
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return false;
    }
  }

  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.log(`✉️ [MailService SIMULATION] OTP Email Sent To: ${to} | Code: ${otp}`);
        return true;
      }

      await this.transporter.sendMail({
        from: '"NearrBuy Security" <security@nearrbuy.com>',
        to,
        subject: 'Your NearrBuy Verification Code',
        html: `<div style="font-family: sans-serif; padding: 20px;"><h3>NearrBuy Code: ${otp}</h3></div>`,
      });
      return true;
    } catch (error) {
      console.error('❌ Error sending OTP email:', error);
      return false;
    }
  }

  async sendReservationReceipt(to: string, details: {
    reservationCode: string;
    productName: string;
    storeName: string;
    storeAddress: string;
    expiresAt: string;
    localPrice: string;
  }): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.log(`✉️ [MailService SIMULATION] Reservation Receipt Sent To: ${to} | Code: ${details.reservationCode}`);
        return true;
      }

      await this.transporter.sendMail({
        from: '"NearrBuy Reservations" <reservations@nearrbuy.com>',
        to,
        subject: `NearrBuy Reservation Confirmed: ${details.reservationCode}`,
        html: `<div style="font-family: sans-serif; padding: 20px;"><h2>NearrBuy Reservation: ${details.reservationCode}</h2></div>`,
      });
      return true;
    } catch (error) {
      console.error('❌ Error sending reservation receipt:', error);
      return false;
    }
  }
}
