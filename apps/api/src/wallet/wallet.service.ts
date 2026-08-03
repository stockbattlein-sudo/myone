import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sums all COMPLETED transactions to get the user's active balance in paise.
   */
  async getBalanceInPaise(userId: string): Promise<number> {
    const aggregate = await this.prisma.walletTransaction.aggregate({
      where: {
        userId,
        status: TransactionStatus.COMPLETED,
      },
      _sum: {
        amountInPaise: true,
      },
    });

    return aggregate._sum.amountInPaise || 0;
  }

  /**
   * Records a pending transaction in the ledger.
   */
  async createPendingTransaction(
    userId: string,
    amountInPaise: number,
    type: TransactionType,
    referenceId?: string,
    metadata?: Record<string, any>,
  ) {
    this.logger.log(`Creating pending transaction [${type}] for user ${userId}: paise ${amountInPaise}`);
    return this.prisma.walletTransaction.create({
      data: {
        userId,
        amountInPaise,
        type,
        status: TransactionStatus.PENDING,
        referenceId,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  }

  /**
   * Completes a pending transaction by its referenceId (e.g. Razorpay Order ID)
   */
  async completeTransactionByReference(referenceId: string) {
    this.logger.log(`Completing transaction with reference ${referenceId}`);
    return this.prisma.walletTransaction.updateMany({
      where: { referenceId, status: TransactionStatus.PENDING },
      data: { status: TransactionStatus.COMPLETED },
    });
  }

  /**
   * Fails a pending transaction by referenceId
   */
  async failTransactionByReference(referenceId: string) {
    this.logger.log(`Failing transaction with reference ${referenceId}`);
    return this.prisma.walletTransaction.updateMany({
      where: { referenceId, status: TransactionStatus.PENDING },
      data: { status: TransactionStatus.FAILED },
    });
  }

  /**
   * Records both deposit & purchase legs as COMPLETED to preserve ledger sanity for direct purchases.
   */
  async logDirectPurchase(
    userId: string,
    amountInPaise: number,
    challengeId: string,
    referenceId: string,
  ) {
    this.logger.log(
      `Logging direct purchase for user ${userId}: amount ₹${amountInPaise / 100}, challenge ${challengeId}`,
    );

    // Check if a pending deposit already exists for this referenceId
    const existingPending = await this.prisma.walletTransaction.findFirst({
      where: {
        userId,
        referenceId,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
      },
    });

    if (existingPending) {
      // Complete the existing pending deposit
      await this.prisma.walletTransaction.update({
        where: { id: existingPending.id },
        data: { status: TransactionStatus.COMPLETED },
      });
      this.logger.log(`Completed existing pending deposit transaction: ${existingPending.id}`);
    } else {
      // Create completed deposit transaction leg (fallback)
      await this.prisma.walletTransaction.create({
        data: {
          userId,
          amountInPaise: amountInPaise,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          referenceId,
          metadata: JSON.stringify({ challengeId, purpose: 'direct_deposit_fallback' }),
        },
      });
    }

    // Create purchase transaction leg (negative amount)
    await this.prisma.walletTransaction.create({
      data: {
        userId,
        amountInPaise: -amountInPaise,
        type: TransactionType.CHALLENGE_PURCHASE,
        status: TransactionStatus.COMPLETED,
        referenceId,
        metadata: JSON.stringify({ challengeId, purpose: 'challenge_debit' }),
      },
    });
  }

  /**
   * Returns paginated transaction history
   */
  async getTransactionHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where: { userId } }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        amountInPaise: t.amountInPaise,
        type: t.type,
        status: t.status,
        referenceId: t.referenceId,
        createdAt: t.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
