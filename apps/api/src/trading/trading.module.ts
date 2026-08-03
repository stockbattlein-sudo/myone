import { Module } from '@nestjs/common';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';
import { TradingAdminController } from './trading-admin.controller';
import { AnalyticsController } from './analytics.controller';
import { LeaderboardController } from './leaderboard.controller';
import { CertificateController } from './certificate.controller';
import { AdminBackofficeController } from '../admin/admin-backoffice.controller';
import { SquareOffCron } from './square-off.cron';
import { MarketDataModule } from '../market-data/market-data.module';

import { RiskService } from './risk.service';
import { RiskCron } from './risk.cron';

@Module({
  imports: [MarketDataModule],
  providers: [TradingService, SquareOffCron, RiskService, RiskCron],
  controllers: [
    TradingController,
    TradingAdminController,
    AnalyticsController,
    LeaderboardController,
    CertificateController,
    AdminBackofficeController,
  ],
  exports: [TradingService, RiskService],
})
export class TradingModule {}
