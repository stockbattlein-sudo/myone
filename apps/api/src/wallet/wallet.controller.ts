import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@CurrentUser('id') userId: string) {
    const balanceInPaise = await this.walletService.getBalanceInPaise(userId);
    return {
      success: true,
      balanceInPaise,
      balanceInInr: balanceInPaise / 100,
    };
  }

  @Get('history')
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    
    const data = await this.walletService.getTransactionHistory(userId, pageNum, limitNum);
    return {
      success: true,
      ...data,
    };
  }
}
