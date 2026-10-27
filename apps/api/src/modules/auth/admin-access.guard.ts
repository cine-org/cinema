import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InvalidAccessTokenException } from '@repo/auth';
import {
  decideAccess,
  PermissionDeniedException,
  ROLE_SCOPE,
  SYSTEM_ROLE,
  type AccessTarget,
  type Grant,
  type TheaterScope,
} from '@repo/iam';
import {
  ADMIN_ACCESS,
  REQUIRED_PERMISSION,
  SURFACE,
  type AdminAccess,
  type ApiSurface,
  type RequiredPermission,
} from '@/common/surface';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './bearer-auth.guard';
import { TheaterLocator } from './theater-locator';

const BEARER = /^Bearer ([^\s]+)$/i;

export type AdminRequest = AuthenticatedRequest & { theaterScope?: TheaterScope };

// Global: closes every admin route by default, so a new one cannot be left open by mistake. User
// routes are not its business. An admin route checks the permission it declares, within the
// caller's theater for theater roles; one that declares none is for ADMIN only.
@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    private readonly theaters: TheaterLocator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const surface = this.reflector.getAllAndOverride<ApiSurface | undefined>(SURFACE, targets);
    if (surface !== 'admin') return true;

    const access = this.reflector.getAllAndOverride<AdminAccess | undefined>(ADMIN_ACCESS, targets);
    if (access === 'public') return true;

    const request = context.switchToHttp().getRequest<AdminRequest>();
    const token = BEARER.exec(request.headers.authorization ?? '')?.[1];
    if (!token) throw new InvalidAccessTokenException();
    request.auth = await this.auth.authenticate(token, 'ADMIN');
    if (access === 'any-internal-role') return true;

    const required = this.reflector.getAllAndOverride<RequiredPermission | undefined>(
      REQUIRED_PERMISSION,
      targets,
    );
    if (!required) {
      if (request.auth.role.key !== SYSTEM_ROLE.SUPER_ADMIN) {
        throw new PermissionDeniedException([`role:${SYSTEM_ROLE.SUPER_ADMIN}`]);
      }
      return true;
    }

    const { role } = request.auth;
    const grant: Grant = {
      roleKey: role.key,
      scope: role.scope,
      clusterId: role.clusterId,
      theaterId: role.theaterId,
      permissions: role.permissions,
    };
    const decision = decideAccess(
      grant,
      required.permission,
      await this.target(required, grant, request),
    );
    if (!decision.allowed) throw new PermissionDeniedException([required.permission]);

    request.theaterScope = decision.theaters;
    return true;
  }

  private async target(
    { target }: RequiredPermission,
    grant: Grant,
    request: AdminRequest,
  ): Promise<AccessTarget> {
    if (!target) return { kind: 'GLOBAL' };
    if (target === 'any-scope') return { kind: 'ANY_SCOPE' };
    if (target === 'list') return { kind: 'LIST' };
    // A global role acts on any theater: no lookup needed.
    if (grant.scope === ROLE_SCOPE.GLOBAL) {
      return { kind: 'THEATER', theaterId: null, clusterId: null };
    }
    const params = request.params as Record<string, string | undefined>;
    const theater = await this.theaters.locate(target, params);
    return {
      kind: 'THEATER',
      theaterId: theater?.id ?? null,
      clusterId: theater?.clusterId ?? null,
    };
  }
}
