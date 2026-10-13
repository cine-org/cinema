import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { InvalidAccessTokenException, type AccessTokenClaims } from '@repo/auth';
import type { Request } from 'express';
import { AuthService } from './auth.service';

export type AuthenticatedRequest = Request & { auth: AccessTokenClaims };

const BEARER = /^Bearer ([^\s]+)$/i;

// Verifies the access token and its session on every request, so a logout takes effect at once.
@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = BEARER.exec(request.headers.authorization ?? '')?.[1];
    if (!token) throw new InvalidAccessTokenException();

    request.auth = await this.auth.authenticate(token);
    return true;
  }
}
