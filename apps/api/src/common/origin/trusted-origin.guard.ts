import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@repo/common';
import type { Request } from 'express';
import { ConfigService } from '@/config';

// CSRF defence for routes that act on the refresh cookie: browsers always send Origin on a POST,
// and a cross-site page cannot forge it. A request without Origin is refused too; non-browser
// clients have no cookie to protect.
@Injectable()
export class TrustedOriginGuard implements CanActivate {
  private readonly allowed: ReadonlySet<string>;

  constructor(config: ConfigService) {
    this.allowed = new Set([...config.app.corsOrigins, new URL(config.app.apiOrigin).origin]);
  }

  canActivate(context: ExecutionContext): boolean {
    const origin = context.switchToHttp().getRequest<Request>().headers.origin;
    if (!origin || !this.allowed.has(origin)) {
      throw new ForbiddenException({ message: 'Request origin is not allowed' });
    }
    return true;
  }
}
