import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';
import { OrderSide, OrderType, OrderStatus, ChallengeStatus } from '@prisma/client';

import { RiskService } from './risk.service';

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketDataService: MarketDataService,
    private readonly riskService: RiskService,
  ) {}

  /**
   * Submits a market or limit order via authenticated REST boundary.
   */
  async placeOrder(
    userId: string,
    challengeId: string,
    symbol: string,
    side: OrderSide,
    type: OrderType,
    quantity: number,
    limitPriceInPaise?: number,
  ) {
    this.logger.log(`Placing order: challenge=${challengeId}, symbol=${symbol}, side=${side}, qty=${quantity}`);

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const challenge = await this.prisma.userChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.userId !== userId) {
      throw new BadRequestException('Unauthorized challenge context');
    }

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      throw new BadRequestException('Challenge is not active for trading');
    }

    // Retrieve current market price in paise
    const currentPriceInPaise = this.marketDataService.getCurrentPrice(symbol);

    if (type === OrderType.LIMIT && !limitPriceInPaise) {
      throw new BadRequestException('Limit price is required for LIMIT orders');
    }

    const orderPriceInPaise = type === OrderType.MARKET ? currentPriceInPaise : limitPriceInPaise!;

    // Create the order in PENDING status if limit, or FILLED if market
    const orderStatus = type === OrderType.MARKET ? OrderStatus.FILLED : OrderStatus.PENDING;

    // Check virtual margin / account constraints before execution (10x leverage check)
    const positions = await this.prisma.userPosition.findMany({
      where: { challengeId },
    });

    const targetSymbolUpper = symbol.toUpperCase();
    const existingPosition = positions.find((p) => p.symbol === targetSymbolUpper);
    const existingQty = existingPosition ? existingPosition.quantity : 0;
    const deltaQty = quantity * (side === OrderSide.BUY ? 1 : -1);
    const expectedQty = existingQty + deltaQty;

    const valuationPriceInPaise = Math.max(currentPriceInPaise, orderPriceInPaise);
    let totalExposureInPaise = 0;
    for (const pos of positions) {
      if (pos.symbol === targetSymbolUpper) {
        continue;
      }
      const currentPrice = this.marketDataService.getCurrentPrice(pos.symbol);
      totalExposureInPaise += Math.abs(pos.quantity) * currentPrice;
    }
    totalExposureInPaise += Math.abs(expectedQty) * valuationPriceInPaise;

    const marginRequiredInPaise = Math.round(totalExposureInPaise / 10);
    if (marginRequiredInPaise > challenge.virtualBalanceInPaise) {
      throw new BadRequestException(
        `Insufficient margin. Order requires ₹${((orderPriceInPaise * quantity) / 1000).toFixed(2)} margin (10x leverage). ` +
        `Total required margin across all positions would be ₹${(marginRequiredInPaise / 100).toFixed(2)}, ` +
        `but available balance is ₹${(challenge.virtualBalanceInPaise / 100).toFixed(2)}.`
      );
    }

    const order = await this.prisma.userOrder.create({
      data: {
        userId,
        challengeId,
        symbol: symbol.toUpperCase(),
        side,
        type,
        status: orderStatus,
        quantity,
        priceInPaise: orderPriceInPaise,
        executedAt: orderStatus === OrderStatus.FILLED ? new Date() : null,
      },
    });

    if (orderStatus === OrderStatus.FILLED) {
      await this.processFilledOrder(challengeId, order.symbol, side, quantity, orderPriceInPaise, order.id);
      await this.riskService.checkProfitTargets(challengeId);
    }

    return {
      success: true,
      order,
    };
  }

  /**
   * Process a filled order, updating positions and calculating realized P&L on square-offs
   */
  private async processFilledOrder(
    challengeId: string,
    symbol: string,
    side: OrderSide,
    quantity: number,
    priceInPaise: number,
    orderId?: string,
  ) {
    // 1. Fetch current open position for this symbol
    const position = await this.prisma.userPosition.findUnique({
      where: {
        challengeId_symbol: { challengeId, symbol },
      },
    });

    let newQty = quantity * (side === OrderSide.BUY ? 1 : -1);
    let newAveragePrice = priceInPaise;

    if (position) {
      const prevQty = position.quantity;
      const prevAvgPrice = position.averagePriceInPaise;
      newQty = prevQty + newQty;

      // Calculate realized P&L if closing out/reducing a position
      const isClosingOrReducing = 
        (prevQty > 0 && side === OrderSide.SELL) || 
        (prevQty < 0 && side === OrderSide.BUY);

      if (isClosingOrReducing) {
        const closedQty = Math.min(Math.abs(prevQty), quantity);
        
        // P&L calculation: (Exit Price - Entry Price) * closedQty
        // If shorting, entry is higher than exit for profit: (Entry Price - Exit Price) * closedQty
        const directionMultiplier = prevQty > 0 ? 1 : -1;
        const realizedPnLInPaise = (priceInPaise - prevAvgPrice) * closedQty * directionMultiplier;

        // Update the challenge's virtual account balance in paise
        await this.prisma.userChallenge.update({
          where: { id: challengeId },
          data: {
            virtualBalanceInPaise: {
              increment: realizedPnLInPaise,
            },
          },
        });

        // Save realized P&L on the order record if orderId is provided
        if (orderId) {
          await this.prisma.userOrder.update({
            where: { id: orderId },
            data: { realizedPnLInPaise },
          });
        }
        
        await this.riskService.recordDailyMetricPnL(challengeId, realizedPnLInPaise);
        
        this.logger.log(`Realized P&L: ₹${realizedPnLInPaise / 100} for challenge ${challengeId}`);
      }

      // Compute new average cost if increasing size (same direction)
      const isIncreasing = 
        (prevQty > 0 && side === OrderSide.BUY) || 
        (prevQty < 0 && side === OrderSide.SELL);

      if (isIncreasing && newQty !== 0) {
        const totalCost = (prevQty * prevAvgPrice) + ((quantity * (side === OrderSide.BUY ? 1 : -1)) * priceInPaise);
        newAveragePrice = Math.round(Math.abs(totalCost / newQty));
      } else if (newQty !== 0) {
        // Reduced but still open, keep previous average cost
        newAveragePrice = prevAvgPrice;
      }
    }

    if (newQty === 0) {
      // Position fully closed -> delete record
      if (position) {
        await this.prisma.userPosition.delete({
          where: { id: position.id },
        });
      }
    } else {
      // Upsert position details
      await this.prisma.userPosition.upsert({
        where: {
          challengeId_symbol: { challengeId, symbol },
        },
        create: {
          challengeId,
          userId: (position ? position.userId : (await this.prisma.userChallenge.findUnique({ where: { id: challengeId } }))?.userId)!,
          symbol,
          quantity: newQty,
          averagePriceInPaise: newAveragePrice,
        },
        update: {
          quantity: newQty,
          averagePriceInPaise: newAveragePrice,
        },
      });
    }
  }

  /**
   * Cancels a pending limit order
   */
  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.userOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(`Cannot cancel order in ${order.status} status`);
    }

    return this.prisma.userOrder.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  /**
   * Returns active open positions
   */
  async getPositions(challengeId: string) {
    return this.prisma.userPosition.findMany({
      where: { challengeId },
      orderBy: { symbol: 'asc' },
    });
  }

  /**
   * Returns paginated order history
   */
  async getOrderHistory(challengeId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.userOrder.findMany({
        where: { challengeId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userOrder.count({ where: { challengeId } }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Force closes an active open position (Market Square Off)
   */
  async forceClosePosition(userId: string, challengeId: string, symbol: string) {
    const position = await this.prisma.userPosition.findUnique({
      where: {
        challengeId_symbol: { challengeId, symbol },
      },
    });

    if (!position) {
      throw new NotFoundException('No active position found to close');
    }

    const side = position.quantity > 0 ? OrderSide.SELL : OrderSide.BUY;
    const qty = Math.abs(position.quantity);

    // Place offsetting market order
    return this.placeOrder(userId, challengeId, symbol, side, OrderType.MARKET, qty);
  }
}
