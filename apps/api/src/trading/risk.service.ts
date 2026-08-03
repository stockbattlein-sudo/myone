import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';
import { ChallengeStatus, ChallengeType, OrderSide, OrderType, OrderStatus, TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketDataService: MarketDataService,
  ) {}

  /**
   * Scans an active challenge to verify drawdown limits.
   * Runs in the 5-second background loop.
   */
  async checkChallengeRisk(challengeId: string) {
    const challenge = await this.prisma.userChallenge.findUnique({
      where: { id: challengeId },
      include: { positions: true },
    });

    if (!challenge || challenge.status !== ChallengeStatus.ACTIVE) {
      return;
    }

    const rules = challenge.rulesSnapshot as any;
    const initialSizeInPaise = rules.accountSize * 100;
    const dailyLossLimit = rules.dailyLossLimit; // e.g. 3.0
    const maxLoss = rules.maxLoss; // e.g. 10.0 or 4.0 for Instant

    // 1. Calculate current equity (balance + unrealized P&L)
    let unrealizedPnLInPaise = 0;
    for (const pos of challenge.positions) {
      const currentPrice = this.marketDataService.getCurrentPrice(pos.symbol);
      const avgPrice = pos.averagePriceInPaise;
      const direction = pos.quantity > 0 ? 1 : -1;
      unrealizedPnLInPaise += (currentPrice - avgPrice) * Math.abs(pos.quantity) * direction;
    }

    const currentEquityInPaise = challenge.virtualBalanceInPaise + unrealizedPnLInPaise;

    // Model C — Trailing Intraday Daily Loss Limit
    // Update intraday peak equity (tracks highest equity reached today)
    const existingPeak = challenge.peakDailyEquityInPaise ?? challenge.dailyStartingBalanceInPaise ?? currentEquityInPaise;
    const newPeakEquityInPaise = Math.max(existingPeak, currentEquityInPaise);

    if (newPeakEquityInPaise > (challenge.peakDailyEquityInPaise ?? 0)) {
      await this.prisma.userChallenge.update({
        where: { id: challengeId },
        data: { peakDailyEquityInPaise: newPeakEquityInPaise },
      });
    }

    // 2. Trailing Daily Loss Breach check against peakDailyEquityInPaise
    const trailingDailyLossInPaise = newPeakEquityInPaise - currentEquityInPaise;
    const dailyLossLimitInPaise = Math.round(initialSizeInPaise * (dailyLossLimit / 100));

    if (trailingDailyLossInPaise > dailyLossLimitInPaise) {
      this.logger.warn(
        `Challenge ${challengeId} breached Trailing Daily Loss Limit: lost ₹${(trailingDailyLossInPaise / 100).toFixed(2)} from peak ₹${(newPeakEquityInPaise / 100).toFixed(2)}, limit was ₹${(dailyLossLimitInPaise / 100).toFixed(2)}`
      );
      await this.failChallenge(
        challengeId,
        `Trailing Intraday Daily Loss Limit of ${dailyLossLimit}% breached (-₹${(trailingDailyLossInPaise / 100).toFixed(2)} from peak).`
      );
      return;
    }

    // 3. Max Drawdown / Total Loss Breach check (UNCHANGED — Fixed against initial account capital)
    const totalLossInPaise = initialSizeInPaise - currentEquityInPaise;
    const maxLossLimitInPaise = Math.round(initialSizeInPaise * (maxLoss / 100));

    if (totalLossInPaise > maxLossLimitInPaise) {
      this.logger.warn(`Challenge ${challengeId} breached Max Loss Limit: lost ₹${(totalLossInPaise / 100).toFixed(2)}, limit was ₹${(maxLossLimitInPaise / 100).toFixed(2)}`);
      await this.failChallenge(challengeId, `Max Drawdown Limit of ${maxLoss}% breached.`);
      return;
    }
  }

  /**
   * Scans a challenge for profit target criteria.
   * Triggered on trade execution.
   */
  async checkProfitTargets(challengeId: string) {
    const challenge = await this.prisma.userChallenge.findUnique({
      where: { id: challengeId },
      include: { tier: true },
    });

    if (!challenge || challenge.status !== ChallengeStatus.ACTIVE) {
      return;
    }

    const rules = challenge.rulesSnapshot as any;
    if (challenge.tier.type === ChallengeType.INSTANT) {
      // Instant accounts do not have evaluation profit targets
      return;
    }

    const initialSizeInPaise = rules.accountSize * 100;
    const currentBalanceInPaise = challenge.virtualBalanceInPaise;
    const netProfitInPaise = currentBalanceInPaise - initialSizeInPaise;

    // Count unique trading days (filled orders dates in Asia/Kolkata)
    const orders = await this.prisma.userOrder.findMany({
      where: { challengeId, status: OrderStatus.FILLED },
    });
    const uniqueDays = new Set(
      orders.map((o) => {
        const date = new Date(o.executedAt || o.createdAt);
        return date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
      })
    );
    const tradingDaysCount = uniqueDays.size;
    const requiredDays = rules.minTradingDays || 0;

    if (challenge.tier.type === ChallengeType.TWO_STEP) {
      if (challenge.currentPhase === 1) {
        const targetProfitInPaise = Math.round(initialSizeInPaise * (rules.targetPhase1 / 100));
        if (netProfitInPaise >= targetProfitInPaise && tradingDaysCount >= requiredDays) {
          await this.promoteToPhase2(challengeId);
        }
      } else if (challenge.currentPhase === 2) {
        const targetProfitInPaise = Math.round(initialSizeInPaise * (rules.targetPhase2 / 100));
        if (netProfitInPaise >= targetProfitInPaise && tradingDaysCount >= requiredDays) {
          await this.passChallenge(challengeId);
        }
      }
    } else if (challenge.tier.type === ChallengeType.ONE_STEP) {
      const targetProfitInPaise = Math.round(initialSizeInPaise * (rules.targetPhase1 / 100));
      if (netProfitInPaise >= targetProfitInPaise && tradingDaysCount >= requiredDays) {
        await this.passChallenge(challengeId);
      }
    }
  }

  /**
   * Promotes a 2-Step challenge to Phase 2, resetting capital and squaring positions.
   */
  private async promoteToPhase2(challengeId: string) {
    this.logger.log(`Promoting challenge ${challengeId} to Phase 2`);
    
    // Close positions and cancel orders
    await this.squareOffAndCancelAll(challengeId);

    const challenge = await this.prisma.userChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) return;

    const initialSizeInPaise = (challenge.rulesSnapshot as any).accountSize * 100;

    await this.prisma.userChallenge.update({
      where: { id: challengeId },
      data: {
        currentPhase: 2,
        virtualBalanceInPaise: initialSizeInPaise,
        dailyStartingBalanceInPaise: initialSizeInPaise,
      },
    });

    // Reset daily metrics for the new phase
    const todayStr = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    await this.prisma.dailyMetric.upsert({
      where: { challengeId_date: { challengeId, date: todayStr } },
      create: {
        challengeId,
        date: todayStr,
        startingBalanceInPaise: initialSizeInPaise,
        closingBalanceInPaise: initialSizeInPaise,
        realizedPnLInPaise: 0,
      },
      update: {
        startingBalanceInPaise: initialSizeInPaise,
        closingBalanceInPaise: initialSizeInPaise,
        realizedPnLInPaise: 0,
      },
    });
  }

  /**
   * Marks a challenge as PASSED.
   */
  private async passChallenge(challengeId: string) {
    this.logger.log(`Challenge ${challengeId} PASSED successfully!`);
    await this.squareOffAndCancelAll(challengeId);

    await this.prisma.userChallenge.update({
      where: { id: challengeId },
      data: { status: ChallengeStatus.PASSED },
    });
  }

  /**
   * Marks a challenge as FAILED.
   */
  private async failChallenge(challengeId: string, reason: string) {
    this.logger.log(`Challenge ${challengeId} FAILED: ${reason}`);
    await this.squareOffAndCancelAll(challengeId);

    await this.prisma.userChallenge.update({
      where: { id: challengeId },
      data: {
        status: ChallengeStatus.FAILED,
        failureReason: reason,
      },
    });
  }

  /**
   * Clears open positions and pending orders.
   */
  public async squareOffAndCancelAll(challengeId: string) {
    // 1. Cancel pending limit orders
    await this.prisma.userOrder.updateMany({
      where: { challengeId, status: OrderStatus.PENDING },
      data: { status: OrderStatus.CANCELLED },
    });

    // 2. Fetch active positions
    const positions = await this.prisma.userPosition.findMany({
      where: { challengeId },
    });

    for (const pos of positions) {
      const currentPrice = this.marketDataService.getCurrentPrice(pos.symbol);
      const avgPrice = pos.averagePriceInPaise;
      const closedQty = Math.abs(pos.quantity);
      const isLong = pos.quantity > 0;
      const side = isLong ? OrderSide.SELL : OrderSide.BUY;

      // Calculate realized profit/loss
      const direction = isLong ? 1 : -1;
      const pnlInPaise = (currentPrice - avgPrice) * closedQty * direction;

      // Log offset trade execution
      await this.prisma.userOrder.create({
        data: {
          userId: pos.userId,
          challengeId,
          symbol: pos.symbol,
          side,
          type: OrderType.MARKET,
          status: OrderStatus.FILLED,
          quantity: closedQty,
          priceInPaise: currentPrice,
          realizedPnLInPaise: pnlInPaise,
          executedAt: new Date(),
        },
      });

      // Update challenge balance
      await this.prisma.userChallenge.update({
        where: { id: challengeId },
        data: {
          virtualBalanceInPaise: {
            increment: pnlInPaise,
          },
        },
      });
    }

    // Delete position entries
    await this.prisma.userPosition.deleteMany({
      where: { challengeId },
    });
  }

  /**
   * Evaluates and processes a payout request for Instant accounts.
   */
  async requestInstantPayout(userId: string, challengeId: string) {
    const challenge = await this.prisma.userChallenge.findUnique({
      where: { id: challengeId },
      include: { tier: true, positions: true },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.userId !== userId) {
      throw new BadRequestException('Unauthorized challenge context');
    }

    if (challenge.tier.type !== ChallengeType.INSTANT) {
      throw new BadRequestException('Payout requests are only available for Instant-funded accounts');
    }

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      throw new BadRequestException('Challenge must be active to request payouts');
    }

    // 1. Flat check: Reject if there are open positions or pending orders
    if (challenge.positions.length > 0) {
      throw new BadRequestException('Please square off all open positions before requesting a payout');
    }

    const pendingOrdersCount = await this.prisma.userOrder.count({
      where: { challengeId, status: OrderStatus.PENDING },
    });
    if (pendingOrdersCount > 0) {
      throw new BadRequestException('Please cancel all pending limit orders before requesting a payout');
    }

    const rules = challenge.rulesSnapshot as any;
    const initialSizeInPaise = rules.accountSize * 100;
    const currentBalanceInPaise = challenge.virtualBalanceInPaise;
    const profitInPaise = currentBalanceInPaise - initialSizeInPaise;

    if (profitInPaise <= 0) {
      throw new BadRequestException('No profit generated. Payouts require account balance to exceed initial size.');
    }

    // 2. Consistency Rule evaluation:
    // "No single day's profit can exceed 15% of the total profit generated during this payout window."
    const consistencyLimit = rules.consistencyRule || 15.0; // default 15%
    const metrics = await this.prisma.dailyMetric.findMany({
      where: { challengeId },
    });

    for (const metric of metrics) {
      const dailyProfit = metric.realizedPnLInPaise;
      if (dailyProfit > 0) {
        const percentageOfTotal = (dailyProfit / profitInPaise) * 100;
        if (percentageOfTotal > consistencyLimit) {
          throw new BadRequestException(
            `Payout request rejected. Consistency rule breach: single day's profit on ${metric.date} (₹${(dailyProfit / 100).toFixed(2)}) ` +
            `represents ${percentageOfTotal.toFixed(1)}% of your net profits, exceeding the limit of ${consistencyLimit}%.`
          );
        }
      }
    }

    // 3. Process cash payout atomically
    const profitSplitPercentage = rules.profitShare || 70.0;
    const payoutAmountInPaise = Math.round(profitInPaise * (profitSplitPercentage / 100));

    await this.prisma.$transaction([
      // Credit user's wallet
      this.prisma.walletTransaction.create({
        data: {
          userId,
          amountInPaise: payoutAmountInPaise,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          referenceId: `payout_${challenge.id}_${Date.now()}`,
          metadata: { challengeId, profitShare: profitSplitPercentage },
        },
      }),

      // Reset account balance & starting baseline to initial size
      this.prisma.userChallenge.update({
        where: { id: challengeId },
        data: {
          virtualBalanceInPaise: initialSizeInPaise,
          dailyStartingBalanceInPaise: initialSizeInPaise,
        },
      }),

      // Wipe daily metrics for the next payout cycle
      this.prisma.dailyMetric.deleteMany({
        where: { challengeId },
      }),
    ]);

    return {
      success: true,
      payoutAmount: payoutAmountInPaise / 100,
      profitShare: profitSplitPercentage,
    };
  }

  /**
   * Tracks daily metrics for positions in closed trade events.
   */
  async recordDailyMetricPnL(challengeId: string, pnlInPaise: number) {
    const todayStr = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    const challenge = await this.prisma.userChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) return;

    await this.prisma.dailyMetric.upsert({
      where: { challengeId_date: { challengeId, date: todayStr } },
      create: {
        challengeId,
        date: todayStr,
        startingBalanceInPaise: challenge.dailyStartingBalanceInPaise,
        closingBalanceInPaise: challenge.virtualBalanceInPaise,
        realizedPnLInPaise: pnlInPaise,
      },
      update: {
        closingBalanceInPaise: challenge.virtualBalanceInPaise,
        realizedPnLInPaise: {
          increment: pnlInPaise,
        },
      },
    });
  }
}
