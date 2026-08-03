import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  SignupInput,
  LoginInput,
  VerifyOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@stockbattle/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Signup ──────────────────────────────────
  @Post('signup')
  @UsePipes(new ZodValidationPipe(signupSchema))
  async signup(
    @Body() dto: SignupInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signup(dto);

    // Set a short-lived cookie so verify-otp knows which user to verify
    this.setPendingCookie(res, result.pendingToken);

    return {
      success: true,
      message: 'Verification code sent to your email',
      maskedEmail: result.maskedEmail,
    };
  }

  // ── Login (password only — no OTP) ─────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 600_000 } }) // 5 per 10 min
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() dto: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    if (result.requiresVerification) {
      // Email not yet verified — send OTP and redirect to verify page
      this.setPendingCookie(res, result.pendingToken!);
      return {
        success: true,
        emailVerified: false,
        message: 'Email not verified. Verification code sent.',
        maskedEmail: result.maskedEmail,
      };
    }

    // Verified user — issue session cookies
    this.setAuthCookies(res, result.accessToken!, result.refreshToken!);
    return {
      success: true,
      emailVerified: true,
      user: result.user,
    };
  }

  // ── Verify OTP ─────────────────────────────
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 600_000 } }) // 5 per 10 min
  @UsePipes(new ZodValidationPipe(verifyOtpSchema))
  async verifyOtp(
    @Body() dto: VerifyOtpInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pendingToken = (req as any).cookies?.pending_verification;
    const result = await this.authService.verifyOtp(dto.code, pendingToken);

    // Clear pending cookie, set full auth cookies
    res.clearCookie('pending_verification');
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      success: true,
      user: result.user,
    };
  }

  // ── Resend OTP ─────────────────────────────
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300_000 } }) // 3 per 5 min
  async resendOtp(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pendingToken = (req as any).cookies?.pending_verification;
    const result = await this.authService.resendOtp(pendingToken);

    // Refresh the pending cookie with a new token
    this.setPendingCookie(res, result.pendingToken);

    return {
      success: true,
      message: 'New verification code sent',
      maskedEmail: result.maskedEmail,
    };
  }

  // ── Forgot Password ────────────────────────
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 600_000 } }) // 5 per 10 min
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(
    @Body() dto: ForgotPasswordInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.forgotPassword(dto.email);

    if (result.pendingToken) {
      this.setPendingCookie(res, result.pendingToken);
    }

    return {
      success: true,
      message: 'If the email exists, a password reset code has been sent',
      maskedEmail: result.maskedEmail,
    };
  }

  // ── Reset Password ─────────────────────────
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 600_000 } }) // 5 per 10 min
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(
    @Body() dto: ResetPasswordInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pendingToken = (req as any).cookies?.pending_verification;
    await this.authService.resetPassword(dto.code, dto.password, pendingToken);

    res.clearCookie('pending_verification');

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  // ── Refresh Token ──────────────────────────
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req as any).cookies?.refresh_token;
    const result = await this.authService.refresh(refreshToken);

    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { success: true };
  }

  // ── Logout ─────────────────────────────────
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req as any).cookies?.refresh_token;
    await this.authService.logout(refreshToken);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { success: true, message: 'Logged out' };
  }

  // ── Cookie Helpers ─────────────────────────

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
    });
  }

  private setPendingCookie(res: Response, token: string) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('pending_verification', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
    });
  }
}
