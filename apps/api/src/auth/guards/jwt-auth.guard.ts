import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that requires a valid JWT access token (from httpOnly cookie).
 * Apply to routes/controllers that require authentication.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
