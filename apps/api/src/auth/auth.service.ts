import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
import { EmailService } from './email.service';
import type { SignupInput, LoginInput, SafeUser } from '@stockbattle/shared';

export type LoginResult =
  | {
      requiresVerification: true;
      pendingToken: string;
      maskedEmail: string;
    }
  | {
      requiresVerification: false;
      accessToken: string;
      refreshToken: string;
      user: SafeUser;
    };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
  ) {}

  // ── Signup ──────────────────────────────────

  async signup(dto: SignupInput) {
    // Check for existing user
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
      },
    });

    // Generate and send OTP for email verification
    const otp = await this.otpService.generateOtp(user.id, 'EMAIL_VERIFY');
    await this.emailService.sendOtp(user.email, otp, user.name);

    // Create a short-lived token so the verify-otp endpoint knows which user
    const pendingToken = this.jwtService.sign(
      { sub: user.id, purpose: 'email_verify' },
      { expiresIn: '10m' },
    );

    return {
      pendingToken,
      maskedEmail: this.maskEmail(user.email),
    };
  }

  // ── Login (password only — no OTP) ─────────

  async login(dto: LoginInput): Promise<LoginResult> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // If email not verified → send OTP and ask to verify first
    if (!user.emailVerified) {
      const otp = await this.otpService.generateOtp(user.id, 'EMAIL_VERIFY');
      await this.emailService.sendOtp(user.email, otp, user.name);

      const pendingToken = this.jwtService.sign(
        { sub: user.id, purpose: 'email_verify' },
        { expiresIn: '10m' },
      );

      return {
        requiresVerification: true,
        pendingToken,
        maskedEmail: this.maskEmail(user.email),
      };
    }

    // Issue full session tokens
    const tokens = await this.issueTokens(user.id, user.role, user.email);

    return {
      requiresVerification: false,
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  // ── Verify OTP ─────────────────────────────

  async verifyOtp(code: string, pendingToken?: string) {
    if (!pendingToken) {
      throw new UnauthorizedException(
        'No pending verification. Please sign up or log in first.',
      );
    }

    // Decode the pending token
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwtService.verify(pendingToken);
    } catch {
      throw new UnauthorizedException(
        'Verification session expired. Please try again.',
      );
    }

    if (payload.purpose !== 'email_verify') {
      throw new UnauthorizedException('Invalid verification session');
    }

    // Validate OTP
    await this.otpService.validateOtp(payload.sub, code, 'EMAIL_VERIFY');

    // Mark email verified
    const user = await this.prisma.user.update({
      where: { id: payload.sub },
      data: { emailVerified: true },
    });

    // Issue full session tokens
    const tokens = await this.issueTokens(user.id, user.role, user.email);

    this.logger.log(`Email verified for user ${user.id} (${user.email})`);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  // ── Resend OTP ─────────────────────────────

  async resendOtp(pendingToken?: string) {
    if (!pendingToken) {
      throw new UnauthorizedException('No pending verification');
    }

    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwtService.verify(pendingToken);
    } catch {
      throw new UnauthorizedException('Session expired. Please try again.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const otp = await this.otpService.generateOtp(user.id, 'EMAIL_VERIFY');
    await this.emailService.sendOtp(user.email, otp, user.name);

    // Issue a fresh pending token (extends the 10-min window)
    const newPendingToken = this.jwtService.sign(
      { sub: user.id, purpose: 'email_verify' },
      { expiresIn: '10m' },
    );

    return {
      pendingToken: newPendingToken,
      maskedEmail: this.maskEmail(user.email),
    };
  }

  // ── Forgot Password ────────────────────────

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Prevent email enumeration
      return {
        pendingToken: '',
        maskedEmail: this.maskEmail(email),
      };
    }

    const otp = await this.otpService.generateOtp(user.id, 'PASSWORD_RESET');
    await this.emailService.sendOtp(user.email, otp, user.name);

    const pendingToken = this.jwtService.sign(
      { sub: user.id, purpose: 'password_reset' },
      { expiresIn: '10m' },
    );

    return {
      pendingToken,
      maskedEmail: this.maskEmail(user.email),
    };
  }

  // ── Reset Password ─────────────────────────

  async resetPassword(
    code: string,
    newPassword: string,
    pendingToken?: string,
  ) {
    if (!pendingToken) {
      throw new UnauthorizedException('No pending reset session');
    }

    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwtService.verify(pendingToken);
    } catch {
      throw new UnauthorizedException(
        'Reset session expired. Please try again.',
      );
    }

    if (payload.purpose !== 'password_reset') {
      throw new UnauthorizedException('Invalid reset session');
    }

    // Validate OTP
    await this.otpService.validateOtp(payload.sub, code, 'PASSWORD_RESET');

    // Hash and update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash },
    });

    this.logger.log(`Password reset successfully for user ${payload.sub}`);
  }

  // ── Refresh Token ──────────────────────────

  async refresh(refreshTokenValue?: string) {
    if (!refreshTokenValue) {
      throw new UnauthorizedException('No refresh token');
    }

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.revoked ||
      tokenRecord.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    // Issue new tokens
    return this.issueTokens(
      tokenRecord.user.id,
      tokenRecord.user.role,
      tokenRecord.user.email,
    );
  }

  // ── Logout ─────────────────────────────────

  async logout(refreshTokenValue?: string) {
    if (refreshTokenValue) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshTokenValue },
        data: { revoked: true },
      });
    }
  }

  // ── Helpers ────────────────────────────────

  private async issueTokens(userId: string, role: string, email: string) {
    const jwtPayload = { sub: userId, role, email };
    const accessToken = this.jwtService.sign(jwtPayload, { expiresIn: '1h' });

    // Opaque refresh token — stored in DB for revocation
    const refreshTokenValue = crypto.randomUUID();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshTokenValue,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private sanitizeUser(user: any): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    };
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${local[1]}***@${domain}`;
  }
}
