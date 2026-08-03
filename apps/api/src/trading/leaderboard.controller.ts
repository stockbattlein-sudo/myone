import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('trading/leaderboard')
export class LeaderboardController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves public trader leaderboard ranked by 4-tier hierarchy:
   * 1. Return % (DESC)
   * 2. Net Realized Profit (DESC)
   * 3. Win Rate % (DESC)
   * 4. Total Closed Trades (DESC)
   */
  @Get()
  async getLeaderboard(@Query('tierType') tierTypeFilter?: string) {
    const challenges = await this.prisma.userChallenge.findMany({
      where: {
        status: { in: ['ACTIVE', 'PASSED'] },
        ...(tierTypeFilter ? { tier: { type: tierTypeFilter as any } } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        tier: true,
        orders: {
          where: { status: 'FILLED', realizedPnLInPaise: { not: null } },
          select: { realizedPnLInPaise: true },
        },
      },
    });

    const rankedList = challenges.map((c) => {
      const initialSizeInPaise = (c.rulesSnapshot as any).accountSize * 100;
      const netProfitInPaise = c.virtualBalanceInPaise - initialSizeInPaise;
      const returnPercentage = Number(
        ((netProfitInPaise / initialSizeInPaise) * 100).toFixed(2),
      );

      const closedTradesCount = c.orders.length;
      const winningTradesCount = c.orders.filter(
        (o) => (o.realizedPnLInPaise ?? 0) > 0,
      ).length;

      const winRate =
        closedTradesCount > 0
          ? Number(((winningTradesCount / closedTradesCount) * 100).toFixed(1))
          : 0.0;

      // Anonymize email/name for public display (e.g. "Rahul S.")
      const nameParts = (c.user.name || 'Anonymous Trader').split(' ');
      const displayName =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
          : nameParts[0];

      return {
        challengeId: c.id,
        traderName: displayName,
        tierName: c.tier.name,
        tierType: c.tier.type,
        status: c.status,
        currentPhase: c.currentPhase,
        accountSizeInPaise: initialSizeInPaise,
        netProfitInPaise,
        returnPercentage,
        winRate,
        closedTradesCount,
        passedAt: c.status === 'PASSED' ? c.updatedAt : null,
      };
    });

    // Enforce 4-tier sort order chain:
    rankedList.sort((a, b) => {
      if (b.returnPercentage !== a.returnPercentage) {
        return b.returnPercentage - a.returnPercentage;
      }
      if (b.netProfitInPaise !== a.netProfitInPaise) {
        return b.netProfitInPaise - a.netProfitInPaise;
      }
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }
      return b.closedTradesCount - a.closedTradesCount;
    });

    // Attach rank number (1-indexed)
    const leaderboardWithRank = rankedList.slice(0, 50).map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    return {
      success: true,
      leaderboard: leaderboardWithRank,
    };
  }
}
