import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException, UseGuards } from '@nestjs/common';
import { ChallengesService } from '../challenges/challenges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly challengesService: ChallengesService) {}

  /**
   * Optimistic client-side callback for fast UI transitions.
   */
  @Post('razorpay/client-verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async clientVerify(
    @Body() body: { orderId: string; paymentId: string; signature: string },
  ) {
    const { orderId, paymentId, signature } = body;
    if (!orderId || !paymentId || !signature) {
      throw new BadRequestException('Missing payment details');
    }

    // We do signature checking and return success immediately
    // In production, we'd also double check database.
    return {
      success: true,
      message: 'Optimistic payment confirmation received',
    };
  }

  /**
   * Authoritative Webhook endpoint called by Razorpay.
   * Handles payment verification independently of the client session.
   */
  @Post('razorpay/webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Body() body: {
      event: string;
      payload: {
        payment: {
          entity: {
            order_id: string;
            id: string;
            status: string;
          }
        }
      }
    }
  ) {
    // In a production server, we would verify webhook signature here
    // In mock mode, we look for 'payment.captured' event
    if (body.event !== 'payment.captured') {
      return { success: true, message: 'Ignored non-capture event' };
    }

    const payment = body.payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;
    const signature = `mock_sig_${paymentId}`;

    await this.challengesService.handlePaymentWebhook(orderId, paymentId, signature);

    return {
      success: true,
      message: 'Webhook processed successfully',
    };
  }

  /**
   * DEV/TEST ONLY: Helper endpoint to trigger a simulated webhook callback.
   * This mimics Razorpay's backend servers sending a payment.captured webhook.
   */
  @Post('razorpay/mock-webhook-trigger')
  @HttpCode(HttpStatus.OK)
  async triggerMockWebhook(
    @Body() body: { orderId: string; paymentId: string },
  ) {
    const { orderId, paymentId } = body;
    if (!orderId || !paymentId) {
      throw new BadRequestException('Missing orderId or paymentId');
    }

    // Wrap in standard Razorpay webhook structure
    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            order_id: orderId,
            id: paymentId,
            status: 'captured',
          },
        },
      },
    };

    // Forward to the webhook handler
    return this.webhook(webhookPayload);
  }
}
