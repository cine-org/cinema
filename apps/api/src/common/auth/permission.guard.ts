import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CheckUserPermissionHandler, CheckUserPermissionQuery } from '@repo/iam';
import type { PermissionCode } from '@repo/contracts';
import type { AuthenticatedRequest } from './auth-context';
import { REQUIRED_PERMISSIONS, REQUIRE_ANY_PERMISSION } from './auth.decorators';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly checker: CheckUserPermissionHandler,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<PermissionCode[]>(REQUIRED_PERMISSIONS, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    const any =
      this.reflector.getAllAndOverride<PermissionCode[]>(REQUIRE_ANY_PERMISSION, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (required.length === 0 && any.length === 0) return true;
    const principal = context.switchToHttp().getRequest<AuthenticatedRequest>().auth;
    if (!principal) return false;
    const has = async (permission: PermissionCode) =>
      this.checker.execute(
        new CheckUserPermissionQuery({ userId: principal.userId, permissionCode: permission }),
      );
    if ((await Promise.all(required.map(has))).some((value) => !value))
      throw new ForbiddenException();
    if (any.length > 0 && !(await Promise.all(any.map(has))).some(Boolean))
      throw new ForbiddenException();
    return true;
  }
}
