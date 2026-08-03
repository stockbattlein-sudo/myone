import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('trading')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves comprehensive metrics, stats, equity curve, and trade history for a specific challenge.
   */
  @Get('challenge/:id/analytics')
  async getChallengeAnalytics(
    @Request() req: any,
    @Param('id') challengeId: string,
  ) {
    const userId = req.user.id;

    // 1. Fetch challenge
    const challenge = await this.prisma.userChallenge.findUnique({
      where: { id: challengeId },
      include: {
        tier: true,
        dailyMetrics: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // 2. Ownership check: enforce ForbiddenException if not owner
    if (challenge.userId !== userId) {
      throw new ForbiddenException('Unauthorized challenge context');
    }

    // 3. Fetch orders for this challenge (ordered ASC for chronological balance tracking)
    const allFilledOrders = await this.prisma.userOrder.findMany({
      where: {
        challengeId,
        status: 'FILLED',
      },
      orderBy: { executedAt: 'asc' },
    });

    const totalOrdersExecuted = allFilledOrders.length;

    // Closed trades are orders that realized P&L (non-null realizedPnLInPaise)
    const closedTrades = allFilledOrders.filter(
      (o) => o.realizedPnLInPaise !== null && o.realizedPnLInPaise !== undefined,
    );

    const totalClosedTrades = closedTrades.length;
    const winningTrades = closedTrades.filter((t) => (t.realizedPnLInPaise ?? 0) > 0);
    const losingTrades = closedTrades.filter((t) => (t.realizedPnLInPaise ?? 0) < 0);

    const winRate =
      totalClosedTrades > 0
        ? Number(((winningTrades.length / totalClosedTrades) * 100).toFixed(1))
        : 0.0;

    const grossProfits = winningTrades.reduce(
      (sum, t) => sum + (t.realizedPnLInPaise ?? 0),
      0,
    );

    // grossLosses calculated as positive magnitude
    const grossLosses = losingTrades.reduce(
      (sum, t) => sum + Math.abs(t.realizedPnLInPaise ?? 0),
      0,
    );

    let profitFactor: number | null = 0;
    if (grossLosses === 0) {
      profitFactor = grossProfits > 0 ? null : 0.0; // null signifies "N/A" on frontend
    } else {
      profitFactor = Number((grossProfits / grossLosses).toFixed(2));
    }

    const avgWinInPaise =
      winningTrades.length > 0 ? Math.round(grossProfits / winningTrades.length) : 0;

    // avgLossInPaise returned as positive magnitude
    const avgLossInPaise =
      losingTrades.length > 0 ? Math.round(grossLosses / losingTrades.length) : 0;

    const initialSizeInPaise = (challenge.rulesSnapshot as any).accountSize * 100;
    const netProfitInPaise = challenge.virtualBalanceInPaise - initialSizeInPaise;

    // 4. Real per-trade Equity Curve compilation
    const equityCurve: Array<{
      timestamp: string;
      date: string;
      closingBalanceInPaise: number;
      realizedPnLInPaise: number;
      symbol?: string;
      side?: string;
      quantity?: number;
      priceInPaise?: number;
    }> = [];

    // Point 0: Start of challenge
    equityCurve.push({
      timestamp: challenge.startDate.toISOString(),
      date: 'Start',
      closingBalanceInPaise: initialSizeInPaise,
      realizedPnLInPaise: 0,
      symbol: 'INIT',
    });

    let runningBalanceInPaise = initialSizeInPaise;

    for (const trade of closedTrades) {
      const pnl = trade.realizedPnLInPaise ?? 0;
      runningBalanceInPaise += pnl;

      const dateStr = new Date(trade.executedAt || trade.createdAt).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      equityCurve.push({
        timestamp: (trade.executedAt || trade.createdAt).toISOString(),
        date: dateStr,
        closingBalanceInPaise: runningBalanceInPaise,
        realizedPnLInPaise: pnl,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        priceInPaise: trade.priceInPaise,
      });
    }

    return {
      success: true,
      challenge: {
        id: challenge.id,
        status: challenge.status,
        currentPhase: challenge.currentPhase,
        tierName: challenge.tier.name,
        tierType: challenge.tier.type,
        accountSizeInPaise: initialSizeInPaise,
        virtualBalanceInPaise: challenge.virtualBalanceInPaise,
        netProfitInPaise,
        dailyStartingBalanceInPaise: challenge.dailyStartingBalanceInPaise,
        peakDailyEquityInPaise: challenge.peakDailyEquityInPaise || challenge.dailyStartingBalanceInPaise,
        failureReason: challenge.failureReason,
        rulesSnapshot: challenge.rulesSnapshot,
      },
      stats: {
        totalOrdersExecuted,
        totalClosedTrades,
        winningTradesCount: winningTrades.length,
        losingTradesCount: losingTrades.length,
        winRate,
        profitFactor,
        grossProfitsInPaise: grossProfits,
        grossLossesInPaise: grossLosses,
        avgWinInPaise,
        avgLossInPaise,
      },
      equityCurve,
      recentClosedTrades: [...closedTrades].reverse().slice(0, 20).map((t) => ({
        id: t.id,
        symbol: t.symbol,
        side: t.side,
        type: t.type,
        quantity: t.quantity,
        priceInPaise: t.priceInPaise,
        realizedPnLInPaise: t.realizedPnLInPaise,
        executedAt: t.executedAt || t.createdAt,
      })),
    };
  }

  /**
   * Retrieves summary analytics across all user challenges for the main dashboard header.
   */
  @Get('user/summary')
  async getUserSummary(@Request() req: any) {
    const userId = req.user.id;

    const challenges = await this.prisma.userChallenge.findMany({
      where: { userId },
      include: { tier: true },
    });

    const activeChallenges = challenges.filter((c) => c.status === 'ACTIVE');

    let totalSimulatedPnLInPaise = 0;
    for (const c of activeChallenges) {
      const initialSize = (c.rulesSnapshot as any).accountSize * 100;
      totalSimulatedPnLInPaise += c.virtualBalanceInPaise - initialSize;
    }

    // Calculate global cumulative win rate over closed trades
    const userClosedTrades = await this.prisma.userOrder.findMany({
      where: {
        userId,
        status: 'FILLED',
        realizedPnLInPaise: { not: null },
      },
      select: { realizedPnLInPaise: true },
    });

    const totalClosed = userClosedTrades.length;
    const wins = userClosedTrades.filter((t) => (t.realizedPnLInPaise ?? 0) > 0).length;
    const globalWinRate =
      totalClosed > 0 ? Number(((wins / totalClosed) * 100).toFixed(1)) : null;

    return {
      success: true,
      activeChallengesCount: activeChallenges.length,
      totalChallengesCount: challenges.length,
      totalSimulatedPnLInPaise,
      globalWinRate,
      totalClosedTrades: totalClosed,
    };
  }
}
