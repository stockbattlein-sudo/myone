import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { ChallengesModule } from './challenges/challenges.module';
import { PaymentsModule } from './payments/payments.module';
import { MarketDataModule } from './market-data/market-data.module';
import { TradingModule } from './trading/trading.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // ── Config (env vars, global) ──────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // ── Rate Limiting ──────────────────────────
    // Global: 60 requests/minute.
    // Auth endpoints override to 5 per 10 min (see AuthController).
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 60,
      },
    ]),

    // ── Database ───────────────────────────────
    PrismaModule,

    // ── Scheduling ─────────────────────────────
    ScheduleModule.forRoot(),

    // ── Feature Modules ────────────────────────
    AuthModule,
    UsersModule,
    WalletModule,
    ChallengesModule,
    PaymentsModule,
    MarketDataModule,
    TradingModule,
  ],
  controllers: [HealthController],
  providers: [
    // Apply throttler globally — individual routes can override via @Throttle()
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
