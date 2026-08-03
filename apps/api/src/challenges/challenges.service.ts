import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayMockService } from '../payments/razorpay-mock.service';
import { WalletService } from '../wallet/wallet.service';
import { ChallengeStatus, TransactionType } from '@prisma/client';

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayMock: RazorpayMockService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Fetches all active challenge tiers config
   */
  async getTiers() {
    return this.prisma.challengeTier.findMany({
      where: { active: true },
      orderBy: { priceInPaise: 'asc' },
    });
  }

  /**
   * Initiates challenge purchase, returns mock Razorpay order details.
   */
  async initiatePurchase(userId: string, tierId: string) {
    const tier = await this.prisma.challengeTier.findUnique({
      where: { id: tierId },
    });

    if (!tier || !tier.active) {
      throw new NotFoundException('Challenge tier not found or inactive');
    }

    // Check if user already has an active challenge (optional policy, usually allowed to buy multiple but let's log it)
    const activeChallengesCount = await this.prisma.userChallenge.count({
      where: { userId, status: ChallengeStatus.ACTIVE },
    });

    if (activeChallengesCount >= 3) {
      throw new BadRequestException('You can have a maximum of 3 active challenges simultaneously');
    }

    // Create a rules snapshot to freeze rules at purchase time
    const rulesSnapshot = {
      maxLoss: tier.maxLoss,
      dailyLossLimit: tier.dailyLossLimit,
      targetPhase1: tier.targetPhase1,
      targetPhase2: tier.targetPhase2,
      minTradingDays: tier.minTradingDays,
      newsTrading: tier.newsTrading,
      weekendHolding: tier.weekendHolding,
      profitShare: tier.profitShare,
      consistencyRule: tier.consistencyRule,
      accountSize: tier.accountSize,
    };

    // Create a pending challenge record
    const challenge = await this.prisma.userChallenge.create({
      data: {
        userId,
        tierId: tier.id,
        status: ChallengeStatus.PENDING_PAYMENT,
        virtualBalanceInPaise: Math.round(tier.accountSize * 100),
        dailyStartingBalanceInPaise: Math.round(tier.accountSize * 100),
        rulesSnapshot,
      },
    });

    // Create a mock Razorpay order
    const mockOrder = this.razorpayMock.createMockOrder(
      tier.priceInPaise,
      `challenge_purchase_${challenge.id}`,
    );

    // Record a pending ledger entry for this purchase
    await this.walletService.createPendingTransaction(
      userId,
      tier.priceInPaise,
      TransactionType.DEPOSIT,
      mockOrder.id,
      { challengeId: challenge.id, purpose: 'challenge_direct_purchase' },
    );

    return {
      success: true,
      orderId: mockOrder.id,
      challengeId: challenge.id,
      priceInPaise: tier.priceInPaise,
      accountSize: tier.accountSize,
      key: 'rzp_test_mockkey123', // Mock key for frontend modal
    };
  }

  /**
   * Authoritative activation of a user's challenge.
   */
  async activateChallenge(userId: string, challengeId: string, orderId: string) {
    this.logger.log(`Activating challenge ${challengeId} for user ${userId}`);

    const challenge = await this.prisma.userChallenge.findUnique({
      where: { id: challengeId },
      include: { tier: true },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.status !== ChallengeStatus.PENDING_PAYMENT) {
      this.logger.warn(`Challenge ${challengeId} is already activated/processed. Status: ${challenge.status}`);
      return challenge;
    }

    // Update challenge status to ACTIVE
    const updatedChallenge = await this.prisma.userChallenge.update({
      where: { id: challengeId },
      data: {
        status: ChallengeStatus.ACTIVE,
        startDate: new Date(),
      },
    });

    // Log the complete double-entry in the wallet ledger
    await this.walletService.logDirectPurchase(
      userId,
      challenge.tier.priceInPaise,
      challengeId,
      orderId,
    );

    return updatedChallenge;
  }

  /**
   * Processes the mock webhook callback.
   * Resolves order, confirms signatures, and activates the challenge.
   */
  async handlePaymentWebhook(orderId: string, paymentId: string, signature: string) {
    this.logger.log(`Webhook received: orderId=${orderId}, paymentId=${paymentId}`);

    // Verify signature
    const isValid = this.razorpayMock.verifyMockSignature(orderId, paymentId, signature);
    if (!isValid) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Find the pending transaction using the orderId (referenceId)
    const transaction = await this.prisma.walletTransaction.findFirst({
      where: { referenceId: orderId, type: TransactionType.DEPOSIT },
    });

    if (!transaction) {
      throw new NotFoundException(`No transaction found for order ID: ${orderId}`);
    }

    // Parse metadata to extract challengeId
    const metadata = JSON.parse(transaction.metadata as string);
    const challengeId = metadata.challengeId;

    if (!challengeId) {
      throw new BadRequestException('Transaction metadata is missing challengeId');
    }

    // Authoritatively activate the challenge
    return this.activateChallenge(transaction.userId, challengeId, orderId);
  }

  /**
   * Fetch user challenges
   */
  async getUserChallenges(userId: string) {
    return this.prisma.userChallenge.findMany({
      where: { userId },
      include: { tier: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
