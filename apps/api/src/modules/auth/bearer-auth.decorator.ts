import {
  applyDecorators,
  createParamDecorator,
  UseGuards,
  type ExecutionContext,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { AccessTokenClaims } from '@repo/auth';
import { BearerAuthGuard, type AuthenticatedRequest } from './bearer-auth.guard';

export function BearerAuth() {
  return applyDecorators(UseGuards(BearerAuthGuard), ApiBearerAuth('bearer'));
}

// The caller set by BearerAuthGuard.
export const CurrentAuth = createParamDecorator(
  (_: unknown, context: ExecutionContext): AccessTokenClaims =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().auth,
);
