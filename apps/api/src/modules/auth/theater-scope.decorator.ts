import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { TheaterScope } from '@repo/iam';
import type { AdminRequest } from './admin-access.guard';

// The theaters a 'list' route may show the caller, set by AdminAccessGuard.
export const TheaterScopeParam = createParamDecorator(
  (_: unknown, context: ExecutionContext): TheaterScope =>
    context.switchToHttp().getRequest<AdminRequest>().theaterScope ?? { all: true },
);
