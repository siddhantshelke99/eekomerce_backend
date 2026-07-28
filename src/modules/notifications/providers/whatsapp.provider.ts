import axios, { AxiosInstance } from 'axios';
import { env } from '../../../config/env.js';

export interface WhatsAppTemplateComponentParameter {
  type: 'text' | 'image' | 'document' | 'currency' | 'date_time';
  text?: string;
  image?: { link: string };
  currency?: { fallback_value: string; code: string; amount_1000: number };
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'quick_reply' | 'url';
  index?: string;
  parameters: WhatsAppTemplateComponentParameter[];
}

export interface WhatsAppTemplatePayload {
  toPhoneNumber: string;
  templateName: string;
  languageCode: string;
  components?: WhatsAppTemplateComponent[];
}

export interface WhatsAppMediaMessagePayload {
  toPhoneNumber: string;
  caption?: string;
  mediaUrl: string;
  mediaType: 'image' | 'document';
}

export interface WhatsAppTextMessagePayload {
  toPhoneNumber: string;
  textMessage: string;
}

export class WhatsAppProvider {
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      baseURL: `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_NUMBER_ID || '100000000000000'}`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: env.WHATSAPP_TOKEN ? `Bearer ${env.WHATSAPP_TOKEN}` : '',
      },
    });
  }

  /**
   * Send WhatsApp Template Message (Order Confirmations, Hold Alerts)
   */
  public async sendTemplateMessage(payload: WhatsAppTemplatePayload): Promise<boolean> {
    try {
      if (!env.WHATSAPP_TOKEN) {
        console.log(`💬 [WhatsAppProvider SIMULATION] Template "${payload.templateName}" sent to ${payload.toPhoneNumber}`);
        return true;
      }

      const response = await this.httpClient.post('/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: payload.toPhoneNumber,
        type: 'template',
        template: {
          name: payload.templateName,
          language: { code: payload.languageCode },
          components: payload.components ?? [],
        },
      });

      return response.status === 200 || response.status === 201;
    } catch (error) {
      console.error(`❌ [WhatsAppProvider] Failed to send template message to ${payload.toPhoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Send Free-form Text or Media Message for "Ask Nearby Stores" photo leads
   */
  public async sendMediaMessage(payload: WhatsAppMediaMessagePayload): Promise<boolean> {
    try {
      if (!env.WHATSAPP_TOKEN) {
        console.log(`💬 [WhatsAppProvider SIMULATION] Media message sent to ${payload.toPhoneNumber}: ${payload.mediaUrl}`);
        return true;
      }

      const response = await this.httpClient.post('/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: payload.toPhoneNumber,
        type: payload.mediaType,
        [payload.mediaType]: {
          link: payload.mediaUrl,
          caption: payload.caption ?? '',
        },
      });

      return response.status === 200 || response.status === 201;
    } catch (error) {
      console.error(`❌ [WhatsAppProvider] Failed to send media message to ${payload.toPhoneNumber}:`, error);
      throw error;
    }
  }

  public async sendTextMessage(payload: WhatsAppTextMessagePayload): Promise<boolean> {
    try {
      if (!env.WHATSAPP_TOKEN) {
        console.log(`💬 [WhatsAppProvider SIMULATION] Text message sent to ${payload.toPhoneNumber}: "${payload.textMessage}"`);
        return true;
      }

      const response = await this.httpClient.post('/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: payload.toPhoneNumber,
        type: 'text',
        text: { body: payload.textMessage },
      });

      return response.status === 200 || response.status === 201;
    } catch (error) {
      console.error(`❌ [WhatsAppProvider] Failed to send text message to ${payload.toPhoneNumber}:`, error);
      throw error;
    }
  }
}
