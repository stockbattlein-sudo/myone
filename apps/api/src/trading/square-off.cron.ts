import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TradingService } from './trading.service';

@Injectable()
export class SquareOffCron {
  private readonly logger = new Logger(SquareOffCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tradingService: TradingService,
  ) {}

  /**
   * Intraday Auto-Square-Off at 3:20 PM IST (9:50 AM UTC equivalent or configured cron).
   * Enforced on weekdays in Asia/Kolkata timezone.
   */
  @Cron('0 20 15 * * 1-5', {
    name: 'eod-square-off',
    timeZone: 'Asia/Kolkata',
  })
  async handleDailySquareOff() {
    this.logger.log('⏰ Starting EOD Auto-Square-Off for weekdays (3:20 PM IST)...');

    // 1. Fetch all open positions
    const openPositions = await this.prisma.userPosition.findMany({});
    
    if (openPositions.length === 0) {
      this.logger.log('ℹ️ No open positions to square off.');
      return;
    }

    this.logger.log(`⏳ Force closing ${openPositions.length} positions...`);

    // 2. Iterate and square off each position
    for (const position of openPositions) {
      try {
        await this.tradingService.forceClosePosition(
          position.userId,
          position.challengeId,
          position.symbol,
        );
        this.logger.log(`✅ Auto squared-off position [${position.symbol}] for user ${position.userId}`);
      } catch (err: any) {
        this.logger.error(
          `❌ Failed to auto square-off position [${position.symbol}] for user ${position.userId}: ${err.message}`,
        );
      }
    }

    this.logger.log('🏁 Auto-Square-Off batch execution completed.');
  }

  /**
   * Admin-triggered force square off for dev testing
   */
  async adminForceSquareOffAll() {
    this.logger.log('🛡️ Admin manually triggered square off for all positions...');
    await this.handleDailySquareOff();
    return { success: true, message: 'All open positions have been squared off' };
  }
}
