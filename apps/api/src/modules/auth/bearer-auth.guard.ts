import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { InvalidAccessTokenException, type AuthenticatedAccount } from '@repo/auth';
import type { Request } from 'express';
import { AuthService } from './auth.service';

export type AuthenticatedRequest = Request & { auth: AuthenticatedAccount };

const BEARER = /^Bearer ([^\s]+)$/i;

// Customer routes: verifies the access token, its session and the account's role on every request,
// so a logout takes effect at once. Admin routes are guarded by AdminAccessGuard.
@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = BEARER.exec(request.headers.authorization ?? '')?.[1];
    if (!token) throw new InvalidAccessTokenException();

    request.auth = await this.auth.authenticate(token, 'USER');
    return true;
  }
}
