import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';

/**
 * JWT strategy that extracts the access token from httpOnly cookies.
 * NO Authorization header fallback — cookies only, per security requirements.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // Extract JWT exclusively from the httpOnly cookie
      jwtFromRequest: (req: Request) => {
        return req?.cookies?.access_token || null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Called after JWT is verified — attaches user to request.
   * Returning null/throwing here rejects the request with 401.
   */
  async validate(payload: { sub: string; role: string; email: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    };
  }
}
