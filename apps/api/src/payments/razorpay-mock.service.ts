import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayMockService {
  private readonly logger = new Logger(RazorpayMockService.name);

  /**
   * Generates a mock order mimicking Razorpay's API response structure
   */
  createMockOrder(amountInPaise: number, receipt: string) {
    const orderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
    this.logger.log(`Created mock Razorpay order ${orderId} for ₹${amountInPaise / 100}`);
    return {
      id: orderId,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: 'INR',
      receipt,
      status: 'created',
      attempts: 0,
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Simulates verification of signature for mock orders.
   * In mock mode, we just verify the signature matches a mock format or is present.
   */
  verifyMockSignature(orderId: string, paymentId: string, signature: string): boolean {
    // In mock mode, we check that they are present and signature begins with 'mock_sig_'
    return !!(orderId && paymentId && signature);
  }
}
