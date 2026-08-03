import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, ChallengeStatus, TransactionType, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RiskService } from '../trading/risk.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminBackofficeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly riskService: RiskService,
  ) {}

  /**
   * Platform Overview Telemetry
   */
  @Get('overview')
  async getOverviewTelemetry() {
    const totalUsers = await this.prisma.user.count({
      where: { role: Role.TRADER },
    });

    const totalChallenges = await this.prisma.userChallenge.count();
    const activeChallenges = await this.prisma.userChallenge.count({
      where: { status: ChallengeStatus.ACTIVE },
    });
    const passedChallenges = await this.prisma.userChallenge.count({
      where: { status: ChallengeStatus.PASSED },
    });
    const failedChallenges = await this.prisma.userChallenge.count({
      where: { status: ChallengeStatus.FAILED },
    });

    const activeList = await this.prisma.userChallenge.findMany({
      where: { status: ChallengeStatus.ACTIVE },
      select: { virtualBalanceInPaise: true },
    });

    const totalVirtualCapitalInPaise = activeList.reduce(
      (sum, c) => sum + c.virtualBalanceInPaise,
      0,
    );

    const payoutTx = await this.prisma.walletTransaction.findMany({
      where: { type: TransactionType.WITHDRAWAL, status: TransactionStatus.COMPLETED },
      select: { amountInPaise: true },
    });

    const totalPayoutsDisbursedInPaise = payoutTx.reduce(
      (sum, tx) => sum + tx.amountInPaise,
      0,
    );

    return {
      success: true,
      telemetry: {
        totalUsers,
        totalChallenges,
        activeChallenges,
        passedChallenges,
        failedChallenges,
        totalVirtualCapitalInPaise,
        totalPayoutsDisbursedInPaise,
        passRatePercentage:
          totalChallenges > 0
            ? Number(((passedChallenges / totalChallenges) * 100).toFixed(1))
            : 0,
      },
    };
  }

  /**
   * List and search all platform challenges
   */
  @Get('challenges')
  async getChallenges(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const whereClause: any = {};

    if (status) {
      whereClause.status = status as ChallengeStatus;
    }

    if (search) {
      whereClause.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const challenges = await this.prisma.userChallenge.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
        tier: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      success: true,
      challenges: challenges.map((c) => {
        const initialSizeInPaise = (c.rulesSnapshot as any).accountSize * 100;
        return {
          id: c.id,
          traderName: c.user.name,
          traderEmail: c.user.email,
          tierName: c.tier.name,
          tierType: c.tier.type,
          status: c.status,
          currentPhase: c.currentPhase,
          accountSizeInPaise: initialSizeInPaise,
          virtualBalanceInPaise: c.virtualBalanceInPaise,
          netProfitInPaise: c.virtualBalanceInPaise - initialSizeInPaise,
          failureReason: c.failureReason,
          createdAt: c.createdAt,
        };
      }),
    };
  }

  /**
   * Admin Override: Change challenge status & force square-off with AdminAuditLog entry
   */
  @Post('challenge/:id/override')
  async overrideChallenge(
    @Request() req: any,
    @Param('id') challengeId: string,
    @Body()
    body: {
      targetStatus: ChallengeStatus;
      reason: string;
      forceSquareOff?: boolean;
    },
  ) {
    const adminId = req.user.id;
    const { targetStatus, reason, forceSquareOff } = body;

    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException(
        'An explicit audit reason of at least 5 characters is required for admin overrides',
      );
    }

    const challenge = await this.prisma.userChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // 1. Force square-off open positions if requested or if breaching/passing
    if (forceSquareOff) {
      await this.riskService.squareOffAndCancelAll(challengeId);
    }

    // 2. Update challenge status
    const updated = await this.prisma.userChallenge.update({
      where: { id: challengeId },
      data: {
        status: targetStatus,
        failureReason:
          targetStatus === ChallengeStatus.FAILED
            ? `Admin Override: ${reason}`
            : challenge.failureReason,
      },
    });

    // 3. Create AdminAuditLog entry with full attribution
    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'OVERRIDE_CHALLENGE_STATUS',
        targetId: challengeId,
        reason,
        metadata: {
          previousStatus: challenge.status,
          newStatus: targetStatus,
          forceSquareOff: !!forceSquareOff,
        },
      },
    });

    return {
      success: true,
      message: `Challenge ${challengeId} status overridden to ${targetStatus}`,
      challenge: updated,
    };
  }

  /**
   * Fetch Admin Audit Logs
   */
  @Get('audit-logs')
  async getAuditLogs() {
    const logs = await this.prisma.adminAuditLog.findMany({
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      success: true,
      logs: logs.map((l) => ({
        id: l.id,
        adminId: l.adminId,
        adminName: l.admin.name,
        adminEmail: l.admin.email,
        action: l.action,
        targetId: l.targetId,
        reason: l.reason,
        metadata: l.metadata,
        createdAt: l.createdAt,
      })),
    };
  }
}
