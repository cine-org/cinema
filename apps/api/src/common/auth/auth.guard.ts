import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '@repo/auth';
import type { AuthenticatedRequest } from './auth-context';
import { PUBLIC_ROUTE } from './auth.decorators';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer '))
      throw new UnauthorizedException('Bearer access token is required');
    const result = await this.auth.authenticate(header.slice(7));
    request.auth = result.principal;
    request.authUser = result.user;
    return true;
  }
}
