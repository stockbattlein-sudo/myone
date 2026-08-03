import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Email service — sends transactional emails.
 *
 * Provider priority:
 *  1. Resend (if RESEND_API_KEY is set)
 *  2. Gmail (if GMAIL_USER + GMAIL_APP_PASSWORD are set)
 *  3. Console logger (dev fallback — logs OTP to stdout)
 *
 * MOCK STATUS: This is a real implementation with a dev fallback.
 * To go live with Resend, set RESEND_API_KEY in .env.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private providerName = 'console';

  constructor(private readonly configService: ConfigService) {
    const resendKey = this.configService.get<string>('RESEND_API_KEY');
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    const gmailPass = this.configService.get<string>('GMAIL_APP_PASSWORD');

    if (resendKey) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: { user: 'resend', pass: resendKey },
      });
      this.providerName = 'Resend';
    } else if (gmailUser && gmailPass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });
      this.providerName = 'Gmail';
    }

    this.logger.log(`Email provider: ${this.providerName}`);
  }

  /**
   * Send an OTP verification email.
   * Falls back to console logging if no email provider is configured.
   */
  async sendOtp(to: string, code: string, name?: string): Promise<void> {
    if (!this.transporter) {
      // DEV MODE — log to console in a visible format
      this.logger.warn(
        `\n` +
        `╔══════════════════════════════════════════╗\n` +
        `║  📧 DEV EMAIL — OTP VERIFICATION        ║\n` +
        `║  To:   ${to.padEnd(33)}║\n` +
        `║  Code: ${code.padEnd(33)}║\n` +
        `╚══════════════════════════════════════════╝\n`,
      );
      return;
    }

    const fromAddress = this.configService.get<string>(
      'EMAIL_FROM',
      'StockBattle <noreply@stockbattle.in>',
    );

    try {
      await this.transporter.sendMail({
        from: fromAddress,
        to,
        subject: 'Your StockBattle Verification Code',
        html: this.buildOtpHtml(code, name),
      });
      this.logger.log(`OTP email sent to ${to} via ${this.providerName}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}:`, error);
      // Don't throw — log the code to console as fallback so dev isn't blocked
      this.logger.warn(`Fallback: OTP for ${to} is ${code}`);
    }
  }

  private buildOtpHtml(code: string, name?: string): string {
    return `
      <div style="background:#0B0E11;color:#F0F4F8;padding:32px;font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#10B981;margin:0;font-size:28px;font-weight:800;">Stock<span style="color:#F0F4F8;">Battle</span></h1>
          <p style="color:#6B7280;margin:4px 0 0;font-size:13px;">Simulation-Based Trading Evaluation</p>
        </div>

        <p style="margin:0 0 8px;font-size:16px;">Hey ${name || 'there'},</p>
        <p style="margin:0 0 24px;color:#9CA3AF;font-size:14px;">Use the code below to verify your email address:</p>

        <div style="background:#1A1F2E;padding:24px;border-radius:10px;text-align:center;margin:0 0 24px;border:1px solid #2A2F3E;">
          <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#10B981;font-family:'Courier New',monospace;">${code}</span>
        </div>

        <p style="color:#6B7280;font-size:13px;margin:0 0 4px;">⏰ This code expires in <strong style="color:#F0F4F8;">10 minutes</strong>.</p>
        <p style="color:#6B7280;font-size:13px;margin:0 0 24px;">If you didn't request this, please ignore this email.</p>

        <hr style="border:none;border-top:1px solid #2A2F3E;margin:0 0 16px;" />
        <p style="color:#4B5563;font-size:11px;margin:0;line-height:1.5;">
          StockBattle is a simulation-based evaluation platform. No real capital is deployed.
          All trading is simulated. Performance-based incentives are internal program rewards, not investment returns.
        </p>
      </div>
    `;
  }
}
