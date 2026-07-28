import axios, { AxiosInstance } from 'axios';
import { env } from '../../../config/env.js';

export interface SmsPayload {
  toPhoneNumber: string;
  message: string;
  templateId?: string;
}

export class SmsProvider {
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: 5000, // 5s strict timeout for OTP delivery
      headers: {
        'Content-Type': 'application/json',
        Authorization: env.SMS_API_KEY ? `Bearer ${env.SMS_API_KEY}` : '',
      },
    });
  }

  public async sendOtpSms(payload: SmsPayload): Promise<boolean> {
    try {
      if (!env.SMS_API_KEY) {
        console.log(`📱 [SmsProvider SIMULATION] High-Priority OTP Sent To: ${payload.toPhoneNumber} | Message: "${payload.message}"`);
        return true;
      }

      const response = await this.httpClient.post('https://api.sms-gateway.com/v1/send', {
        to: payload.toPhoneNumber,
        sender_id: env.SMS_SENDER_ID,
        message: payload.message,
        template_id: payload.templateId,
        priority: 'HIGH',
      });

      return response.status === 200 || response.status === 201;
    } catch (error) {
      console.error(`❌ [SmsProvider] Failed to deliver OTP SMS to ${payload.toPhoneNumber}:`, error);
      throw error;
    }
  }
}
