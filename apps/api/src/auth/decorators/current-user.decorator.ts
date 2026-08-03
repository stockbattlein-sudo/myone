import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator to extract the authenticated user from the request.
 * The user is attached by JwtStrategy.validate().
 *
 * @example
 *   @Get('me')
 *   @UseGuards(JwtAuthGuard)
 *   getProfile(@CurrentUser() user: SafeUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
