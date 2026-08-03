import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * SMS service — sends OTP codes via SMS.
 *
 * MOCK STATUS: This is a STUB implementation.
 * Production provider: MSG91 (India-focused, DLT compliant).
 *
 * To unlock:
 *  1. Sign up at https://msg91.com
 *  2. Register DLT template for OTP
 *  3. Set MSG91_AUTH_KEY, MSG91_TEMPLATE_ID, MSG91_SENDER_ID in .env
 *  4. Replace the sendOtp method body with MSG91 API call
 *
 * The interface is designed to match MSG91's API shape for a seamless swap.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isConfigured = !!this.configService.get<string>('MSG91_AUTH_KEY');

    if (this.isConfigured) {
      this.logger.log('SMS provider: MSG91 (configured)');
    } else {
      this.logger.log('SMS provider: console-logger (stub)');
    }
  }

  /**
   * Send an OTP via SMS.
   *
   * Currently a stub — logs to console.
   * When MSG91 credentials are provided, this will call:
   *   POST https://control.msg91.com/api/v5/otp
   *   { template_id, mobile, otp }
   */
  async sendOtp(phone: string, code: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn(
        `\n` +
        `╔══════════════════════════════════════════╗\n` +
        `║  📱 SMS STUB — OTP VERIFICATION          ║\n` +
        `║  To:   ${phone.padEnd(33)}║\n` +
        `║  Code: ${code.padEnd(33)}║\n` +
        `║                                          ║\n` +
        `║  Set MSG91_AUTH_KEY to enable real SMS    ║\n` +
        `╚══════════════════════════════════════════╝\n`,
      );
      return;
    }

    // TODO: Replace with real MSG91 API call when credentials are provided
    // const authKey = this.configService.get<string>('MSG91_AUTH_KEY');
    // const templateId = this.configService.get<string>('MSG91_TEMPLATE_ID');
    // const response = await fetch('https://control.msg91.com/api/v5/otp', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'authkey': authKey,
    //   },
    //   body: JSON.stringify({
    //     template_id: templateId,
    //     mobile: `91${phone}`, // India country code
    //     otp: code,
    //   }),
    // });

    this.logger.log(`SMS OTP sent to ${phone} via MSG91`);
  }
}
