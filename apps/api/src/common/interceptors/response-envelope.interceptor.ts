import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Page } from '@repo/common';
import { map, type Observable } from 'rxjs';
import {
  PaginatedResponse,
  RESPONSE_ENVELOPE,
  SuccessResponse,
  type ResponseEnvelope,
} from '@/common/responses';

const WRAP: Record<Exclude<ResponseEnvelope, 'raw'>, (result: unknown) => unknown> = {
  success: (data) => SuccessResponse.of({ data }),
  paginated: (page) => PaginatedResponse.fromPage(page as Page<unknown>),
};

// Wraps a controller's result in the envelope its route declares; errors go through the exception filter.
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const envelope =
      this.reflector.getAllAndOverride<ResponseEnvelope>(RESPONSE_ENVELOPE, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'success';

    if (envelope === 'raw') return next.handle();

    return next.handle().pipe(map(WRAP[envelope]));
  }
}
