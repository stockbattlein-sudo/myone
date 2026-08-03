import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SafeUser } from '@stockbattle/shared';

@Controller('users')
export class UsersController {
  /**
   * GET /api/users/me
   * Returns the authenticated user's profile.
   * Used by the frontend AuthProvider to check auth state on page load.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: SafeUser) {
    return {
      success: true,
      data: user,
    };
  }
}
