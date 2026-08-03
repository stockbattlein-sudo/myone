import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OtpType } from '@prisma/client';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a 6-digit OTP, invalidate any existing unused codes of the same type,
   * and store the new code with a 10-minute expiry.
   */
  async generateOtp(userId: string, type: OtpType): Promise<string> {
    // Invalidate all previous unused OTPs of this type for this user
    await this.prisma.otpCode.updateMany({
      where: { userId, type, used: false },
      data: { used: true },
    });

    // Generate cryptographically random 6-digit code
    const code = String(
      100_000 + Math.floor(Math.random() * 900_000),
    );

    await this.prisma.otpCode.create({
      data: {
        userId,
        code,
        type,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    this.logger.debug(`OTP generated for user ${userId}, type ${type}`);
    return code;
  }

  /**
   * Validate an OTP — checks code, type, expiry, and single-use constraint.
   * Throws UnauthorizedException if invalid.
   */
  async validateOtp(
    userId: string,
    code: string,
    type: OtpType,
  ): Promise<void> {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        code,
        type,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    // Mark as used (single-use)
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    this.logger.debug(`OTP validated for user ${userId}, type ${type}`);
  }
}
