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
        from: '"Project Local" <no-reply@projectlocal.com>',
        to,
        subject: 'Welcome to Project Local — Search Online. Find It Nearby.',
        html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Welcome, ${name}!</h2></div>`,
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
        from: '"Project Local Security" <security@projectlocal.com>',
        to,
        subject: 'Your Project Local Verification Code',
        html: `<div style="font-family: sans-serif; padding: 20px;"><h3>Code: ${otp}</h3></div>`,
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
        from: '"Project Local Reservations" <reservations@projectlocal.com>',
        to,
        subject: `Reservation Confirmed: ${details.reservationCode}`,
        html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Reservation: ${details.reservationCode}</h2></div>`,
      });
      return true;
    } catch (error) {
      console.error('❌ Error sending reservation receipt:', error);
      return false;
    }
  }
}
