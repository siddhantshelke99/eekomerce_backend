import { otpQueue, whatsappLeadQueue, emailQueue, WhatsAppLeadJobData } from '../queues/notification.queue.js';
import { EmailOptions } from '../providers/email.provider.js';

export class NotificationService {
  /**
   * Enqueue High-Priority OTP SMS
   */
  async sendOtp(toPhoneNumber: string, code: string): Promise<string> {
    const job = await otpQueue.add('SEND_OTP_SMS', {
      payload: {
        toPhoneNumber,
        message: `Your Project Local verification code is ${code}. Valid for 10 minutes.`,
      },
    });

    console.log(`🚀 [NotificationService] OTP job enqueued: #${job.id} for ${toPhoneNumber}`);
    return job.id || 'enqueued';
  }

  /**
   * Enqueue Spatial "Ask Nearby Stores" Photo Broadcast Lead
   */
  async broadcastLocalLead(leadData: WhatsAppLeadJobData): Promise<string> {
    const job = await whatsappLeadQueue.add('BROADCAST_LEAD', leadData);

    console.log(`🚀 [NotificationService] WhatsApp Lead broadcast job enqueued: #${job.id}`);
    return job.id || 'enqueued';
  }

  /**
   * Enqueue Transactional Email (Receipts, Welcome emails)
   */
  async sendTransactionalEmail(options: EmailOptions): Promise<string> {
    const job = await emailQueue.add('SEND_TRANSACTIONAL_EMAIL', { options });

    console.log(`🚀 [NotificationService] Transactional Email job enqueued: #${job.id} for ${options.to}`);
    return job.id || 'enqueued';
  }
}
