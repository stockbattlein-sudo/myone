import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get('tiers')
  async getTiers() {
    const tiers = await this.challengesService.getTiers();
    return {
      success: true,
      tiers,
    };
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getUserChallenges(@CurrentUser('id') userId: string) {
    const challenges = await this.challengesService.getUserChallenges(userId);
    return {
      success: true,
      challenges,
    };
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  async initiatePurchase(
    @CurrentUser('id') userId: string,
    @Body('tierId') tierId: string,
  ) {
    if (!tierId) {
      throw new BadRequestException('tierId is required');
    }
    return this.challengesService.initiatePurchase(userId, tierId);
  }
}
