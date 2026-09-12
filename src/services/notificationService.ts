import { SmsProviderConfig, WhatsAppProviderConfig } from '../types';

export interface SendMessageResult {
  success: boolean;
  messageId: string;
  provider: string;
  channel: 'sms' | 'whatsapp';
  timestamp: string;
  simulated?: boolean;
}

/**
 * Configurable SMS provider abstraction layer
 */
export async function sendSmsNotification(
  toMobile: string,
  message: string,
  config: SmsProviderConfig
): Promise<SendMessageResult> {
  const timestamp = new Date().toISOString();
  const messageId = `sms_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  if (!config.enabled) {
    return {
      success: false,
      messageId,
      provider: config.provider,
      channel: 'sms',
      timestamp,
    };
  }

  // Handle external provider integration when API keys are configured
  if (config.provider === 'custom_webhook' && config.webhookUrl) {
    try {
      await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: toMobile, message, senderId: config.senderId }),
      });
      return {
        success: true,
        messageId,
        provider: 'custom_webhook',
        channel: 'sms',
        timestamp,
      };
    } catch {
      // Fallback
    }
  }

  // Simulated provider abstraction for local/offline execution
  return {
    success: true,
    messageId,
    provider: config.provider || 'mock',
    channel: 'sms',
    timestamp,
    simulated: true,
  };
}

/**
 * Configurable WhatsApp provider abstraction layer
 * Strictly reserved for Admin payment alerts (Rule 38)
 */
export async function sendAdminWhatsAppNotification(
  toMobile: string,
  message: string,
  config: WhatsAppProviderConfig
): Promise<SendMessageResult> {
  const timestamp = new Date().toISOString();
  const messageId = `wa_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  if (!config.enabled) {
    return {
      success: false,
      messageId,
      provider: config.provider,
      channel: 'whatsapp',
      timestamp,
    };
  }

  return {
    success: true,
    messageId,
    provider: config.provider || 'mock',
    channel: 'whatsapp',
    timestamp,
    simulated: true,
  };
}
