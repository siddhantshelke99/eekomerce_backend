export interface SmsNotificationPayload {
  toPhoneNumber: string;
  message: string;
  templateId?: string;
}

export class MessagingService {
  /**
   * Sends an SMS notification (Twilio / SMS Gateway abstraction).
   */
  async sendSms(payload: SmsNotificationPayload): Promise<boolean> {
    try {
      console.log(`📱 [SMS SENT] To: ${payload.toPhoneNumber} | Message: "${payload.message}"`);
      return true;
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
      return false;
    }
  }

  /**
   * Sends a WhatsApp notification to vendor or customer.
   */
  async sendWhatsAppMessage(toPhoneNumber: string, message: string): Promise<boolean> {
    try {
      console.log(`💬 [WHATSAPP SENT] To: ${toPhoneNumber} | Message: "${message}"`);
      return true;
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      return false;
    }
  }
}
