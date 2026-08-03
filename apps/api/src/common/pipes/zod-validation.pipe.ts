import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/**
 * NestJS pipe that validates request bodies against a Zod schema.
 *
 * Usage in a controller:
 *   @UsePipes(new ZodValidationPipe(signupSchema))
 *   async signup(@Body() dto: SignupInput) { ... }
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        throw new BadRequestException(
          firstIssue?.message || 'Validation failed',
        );
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
