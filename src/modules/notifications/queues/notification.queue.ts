import { Queue } from 'bullmq';
import { redisOptions } from '../../../config/redis.js';
import { SmsPayload } from '../providers/sms.provider.js';
import { EmailOptions } from '../providers/email.provider.js';

export interface OtpJobData {
  payload: SmsPayload;
}

export interface WhatsAppLeadJobData {
  vendorPhones: string[];
  title: string;
  description?: string;
  imageUrl?: string;
  externalUrl?: string;
}

export interface EmailJobData {
  options: EmailOptions;
}

// 1. OTP Queue (High Priority, Fast Retries)
export const otpQueue = new Queue<OtpJobData>('OTP_QUEUE', {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

// 2. WhatsApp Lead Queue ("Ask Nearby Stores" Photo Leads)
export const whatsappLeadQueue = new Queue<WhatsAppLeadJobData>('WHATSAPP_LEAD_QUEUE', {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 3000,
    },
    removeOnComplete: true,
    removeOnFail: 50,
  },
});

// 3. Email Queue (Transactional Receipts & Welcome Emails)
export const emailQueue = new Queue<EmailJobData>('EMAIL_QUEUE', {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: 500,
  },
});
