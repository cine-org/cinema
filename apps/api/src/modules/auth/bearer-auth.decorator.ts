import {
  applyDecorators,
  createParamDecorator,
  UseGuards,
  type ExecutionContext,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { AuthenticatedAccount } from '@repo/auth';
import { BearerAuthGuard, type AuthenticatedRequest } from './bearer-auth.guard';

// A customer access token.
export function BearerAuth() {
  return applyDecorators(UseGuards(BearerAuthGuard), ApiBearerAuth('bearer'));
}

// The caller set by the bearer guard, or by AdminAccessGuard on admin routes.
export const CurrentAuth = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedAccount =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().auth,
);
