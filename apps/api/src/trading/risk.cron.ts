import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RiskService } from './risk.service';
import { ChallengeStatus } from '@prisma/client';

@Injectable()
export class RiskCron {
  private readonly logger = new Logger(RiskCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly riskService: RiskService,
  ) {}

  /**
   * Runs every 5 seconds to monitor risk and check drawdown limits.
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleRiskEvaluation() {
    // Find all active challenges
    const activeChallenges = await this.prisma.userChallenge.findMany({
      where: { status: ChallengeStatus.ACTIVE },
      select: { id: true },
    });

    for (const challenge of activeChallenges) {
      try {
        await this.riskService.checkChallengeRisk(challenge.id);
        await this.riskService.checkProfitTargets(challenge.id);
      } catch (err) {
        this.logger.error(`Error checking risk/targets for challenge ${challenge.id}:`, err);
      }
    }
  }

  /**
   * Daily midnight reset at 00:00 AM IST (Asia/Kolkata) to update baseline capital.
   */
  @Cron('0 0 * * *', {
    timeZone: 'Asia/Kolkata',
  })
  async handleMidnightReset() {
    this.logger.log('🕛 Running midnight reset cron (Asia/Kolkata)...');
    
    // Find all active challenges
    const activeChallenges = await this.prisma.userChallenge.findMany({
      where: { status: ChallengeStatus.ACTIVE },
    });

    const todayStr = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

    for (const challenge of activeChallenges) {
      try {
        const currentBalance = challenge.virtualBalanceInPaise;

        // 1. Update dailyStartingBalance & reset peakDailyEquity in challenge for new day
        await this.prisma.userChallenge.update({
          where: { id: challenge.id },
          data: {
            dailyStartingBalanceInPaise: currentBalance,
            peakDailyEquityInPaise: currentBalance,
          },
        });

        // 2. Upsert DailyMetric for today
        await this.prisma.dailyMetric.upsert({
          where: {
            challengeId_date: { challengeId: challenge.id, date: todayStr },
          },
          create: {
            challengeId: challenge.id,
            date: todayStr,
            startingBalanceInPaise: currentBalance,
            closingBalanceInPaise: currentBalance,
            realizedPnLInPaise: 0,
          },
          update: {
            startingBalanceInPaise: currentBalance,
            closingBalanceInPaise: currentBalance,
          },
        });

        this.logger.log(`✅ Daily starting balance reset to ₹${(currentBalance / 100).toFixed(2)} for challenge ${challenge.id}`);
      } catch (err) {
        this.logger.error(`Failed to reset daily balance for challenge ${challenge.id}:`, err);
      }
    }
  }
}
