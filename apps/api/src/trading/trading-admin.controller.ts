import { Controller, Post, UseGuards } from '@nestjs/common';
import { SquareOffCron } from './square-off.cron';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('trading/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TradingAdminController {
  constructor(private readonly squareOffCron: SquareOffCron) {}

  /**
   * DEV/ADMIN ONLY: Endpoint to manually force EOD square-offs on demand.
   */
  @Post('force-square-off')
  @Roles(Role.ADMIN)
  async forceSquareOff() {
    return this.squareOffCron.adminForceSquareOffAll();
  }
}
