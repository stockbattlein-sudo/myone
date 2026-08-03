import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Controller('trading/certificate')
export class CertificateController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates certificate metadata & HMAC signature for a passed evaluation challenge.
   */
  @Get('challenge/:id')
  @UseGuards(JwtAuthGuard)
  async getCertificate(@Request() req: any, @Param('id') challengeId: string) {
    const userId = req.user.id;

    const challenge = await this.prisma.userChallenge.findUnique({
      where: { id: challengeId },
      include: {
        user: true,
        tier: true,
      },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.userId !== userId) {
      throw new ForbiddenException('Unauthorized challenge context');
    }

    if (challenge.status !== 'PASSED') {
      throw new BadRequestException(
        'Certificates are only issued for successfully passed evaluation challenges',
      );
    }

    const initialSizeInPaise = (challenge.rulesSnapshot as any).accountSize * 100;
    const netProfitInPaise = challenge.virtualBalanceInPaise - initialSizeInPaise;

    // Cryptographic HMAC signature using dedicated CERTIFICATE_SECRET
    const certSecret =
      process.env.CERTIFICATE_SECRET || 'stockbattle_cert_secret_key_2026';
    const hmacPayload = `${challenge.id}:${challenge.userId}:${challenge.updatedAt.toISOString()}`;
    const hmacSignature = crypto
      .createHmac('sha256', certSecret)
      .update(hmacPayload)
      .digest('hex');

    return {
      success: true,
      certificate: {
        certificateId: `CERT-${challenge.id.slice(-8).toUpperCase()}`,
        challengeId: challenge.id,
        traderName: challenge.user.name,
        traderEmail: challenge.user.email,
        tierName: challenge.tier.name,
        tierType: challenge.tier.type,
        accountSizeInPaise: initialSizeInPaise,
        virtualBalanceInPaise: challenge.virtualBalanceInPaise,
        netProfitInPaise,
        passedAt: challenge.updatedAt,
        hmacSignature,
        verificationUrl: `/trader/certificate/verify/${challenge.id}`,
      },
    };
  }

  /**
   * Public verification endpoint allowing 3rd parties to verify certificate authenticity.
   */
  @Get('verify/:id')
  async verifyCertificate(@Param('id') challengeId: string) {
    const challenge = await this.prisma.userChallenge.findUnique({
      where: { id: challengeId },
      include: {
        user: true,
        tier: true,
      },
    });

    if (!challenge || challenge.status !== 'PASSED') {
      return {
        valid: false,
        message: 'Invalid certificate or evaluation not passed',
      };
    }

    const initialSizeInPaise = (challenge.rulesSnapshot as any).accountSize * 100;
    const netProfitInPaise = challenge.virtualBalanceInPaise - initialSizeInPaise;

    const certSecret =
      process.env.CERTIFICATE_SECRET || 'stockbattle_cert_secret_key_2026';
    const hmacPayload = `${challenge.id}:${challenge.userId}:${challenge.updatedAt.toISOString()}`;
    const hmacSignature = crypto
      .createHmac('sha256', certSecret)
      .update(hmacPayload)
      .digest('hex');

    return {
      valid: true,
      certificateId: `CERT-${challenge.id.slice(-8).toUpperCase()}`,
      challengeId: challenge.id,
      traderName: challenge.user.name,
      tierName: challenge.tier.name,
      tierType: challenge.tier.type,
      accountSizeInPaise: initialSizeInPaise,
      netProfitInPaise,
      passedAt: challenge.updatedAt,
      hmacSignature,
    };
  }
}
