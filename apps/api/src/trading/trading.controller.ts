import { Controller, Post, Get, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { TradingService } from './trading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrderSide, OrderType } from '@prisma/client';

import { RiskService } from './risk.service';

@Controller('trading')
@UseGuards(JwtAuthGuard)
export class TradingController {
  constructor(
    private readonly tradingService: TradingService,
    private readonly riskService: RiskService,
  ) {}

  @Post('order')
  async placeOrder(
    @CurrentUser('id') userId: string,
    @Body('challengeId') challengeId: string,
    @Body('symbol') symbol: string,
    @Body('side') side: OrderSide,
    @Body('type') type: OrderType,
    @Body('quantity') quantity: number,
    @Body('limitPriceInPaise') limitPriceInPaise?: number,
  ) {
    if (!challengeId || !symbol || !side || !type || !quantity) {
      throw new BadRequestException('Missing required order parameters');
    }

    return this.tradingService.placeOrder(
      userId,
      challengeId,
      symbol,
      side,
      type,
      quantity,
      limitPriceInPaise,
    );
  }

  @Post('order/:id/cancel')
  async cancelOrder(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
  ) {
    return this.tradingService.cancelOrder(userId, orderId);
  }

  @Get('positions')
  async getPositions(@Query('challengeId') challengeId: string) {
    if (!challengeId) {
      throw new BadRequestException('challengeId is required');
    }
    const positions = await this.tradingService.getPositions(challengeId);
    return {
      success: true,
      positions,
    };
  }

  @Get('history')
  async getHistory(
    @Query('challengeId') challengeId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    if (!challengeId) {
      throw new BadRequestException('challengeId is required');
    }
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    const data = await this.tradingService.getOrderHistory(challengeId, pageNum, limitNum);
    return {
      success: true,
      ...data,
    };
  }

  @Post('position/close')
  async closePosition(
    @CurrentUser('id') userId: string,
    @Body('challengeId') challengeId: string,
    @Body('symbol') symbol: string,
  ) {
    if (!challengeId || !symbol) {
      throw new BadRequestException('challengeId and symbol are required');
    }
    return this.tradingService.forceClosePosition(userId, challengeId, symbol);
  }

  @Post('challenge/:id/payout')
  async requestPayout(
    @CurrentUser('id') userId: string,
    @Param('id') challengeId: string,
  ) {
    if (!challengeId) {
      throw new BadRequestException('challengeId is required');
    }
    return this.riskService.requestInstantPayout(userId, challengeId);
  }
}
