import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponse } from '@/common/responses';
import { TrustedOriginGuard } from './trusted-origin.guard';

// Accepts the route only from the api's own origin or CORS_ORIGINS.
export function TrustedOrigin() {
  return applyDecorators(
    UseGuards(TrustedOriginGuard),
    ApiResponse({
      status: 403,
      type: ErrorResponse,
      description: 'FORBIDDEN: missing or untrusted Origin header.',
    }),
  );
}
