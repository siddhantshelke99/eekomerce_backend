import { Worker, Job } from 'bullmq';
import { redisOptions } from '../../../config/redis.js';
import { OtpJobData, WhatsAppLeadJobData, EmailJobData } from '../queues/notification.queue.js';
import { SmsProvider } from '../providers/sms.provider.js';
import { WhatsAppProvider } from '../providers/whatsapp.provider.js';
import { EmailProvider } from '../providers/email.provider.js';

const smsProvider = new SmsProvider();
const whatsAppProvider = new WhatsAppProvider();
const emailProvider = EmailProvider.getInstance();

// 1. OTP Worker Processing
export const otpWorker = new Worker<OtpJobData>(
  'OTP_QUEUE',
  async (job: Job<OtpJobData>) => {
    const { payload } = job.data;
    console.log(`⚙️ [OTPWorker] Processing job #${job.id} for ${payload.toPhoneNumber}`);
    await smsProvider.sendOtpSms(payload);
  },
  {
    connection: redisOptions,
    concurrency: 5,
    stalledInterval: 30000,
  }
);

otpWorker.on('completed', (job: Job<OtpJobData>) => {
  console.log(`✅ [OTPWorker] Job #${job.id} completed successfully`);
});

otpWorker.on('failed', (job: Job<OtpJobData> | undefined, err: Error) => {
  console.error(`❌ [OTPWorker] Job #${job?.id || 'unknown'} failed: ${err.message}`);
});

// 2. WhatsApp Lead Worker Processing ("Ask Nearby Stores")
export const whatsappLeadWorker = new Worker<WhatsAppLeadJobData>(
  'WHATSAPP_LEAD_QUEUE',
  async (job: Job<WhatsAppLeadJobData>) => {
    const { vendorPhones, title, description, imageUrl, externalUrl } = job.data;
    console.log(`⚙️ [WhatsAppLeadWorker] Broadcasting lead "${title}" to ${vendorPhones.length} vendors`);

    const messageText = `[ASK NEARBY STORES LEAD]\nA customer near you is asking for: "${title}".\nDetails: ${description || 'N/A'}\nReference Link: ${externalUrl || 'N/A'}`;

    for (const phone of vendorPhones) {
      if (imageUrl) {
        await whatsAppProvider.sendMediaMessage({
          toPhoneNumber: phone,
          mediaUrl: imageUrl,
          mediaType: 'image',
          caption: messageText,
        });
      } else {
        await whatsAppProvider.sendTextMessage({
          toPhoneNumber: phone,
          textMessage: messageText,
        });
      }
    }
  },
  {
    connection: redisOptions,
    concurrency: 10,
    stalledInterval: 30000,
  }
);

whatsappLeadWorker.on('completed', (job: Job<WhatsAppLeadJobData>) => {
  console.log(`✅ [WhatsAppLeadWorker] Lead broadcast #${job.id} sent successfully`);
});

whatsappLeadWorker.on('failed', (job: Job<WhatsAppLeadJobData> | undefined, err: Error) => {
  console.error(`❌ [WhatsAppLeadWorker] Lead broadcast #${job?.id || 'unknown'} failed: ${err.message}`);
});

// 3. Email Worker Processing
export const emailWorker = new Worker<EmailJobData>(
  'EMAIL_QUEUE',
  async (job: Job<EmailJobData>) => {
    const { options } = job.data;
    console.log(`⚙️ [EmailWorker] Processing transactional email job #${job.id} for ${options.to}`);
    await emailProvider.sendEmail(options);
  },
  {
    connection: redisOptions,
    concurrency: 5,
    stalledInterval: 30000,
  }
);

emailWorker.on('completed', (job: Job<EmailJobData>) => {
  console.log(`✅ [EmailWorker] Email job #${job.id} completed successfully`);
});

emailWorker.on('failed', (job: Job<EmailJobData> | undefined, err: Error) => {
  console.error(`❌ [EmailWorker] Email job #${job?.id || 'unknown'} failed: ${err.message}`);
});
