import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '@repo/contracts';
import type { AuthenticatedRequest } from './auth-context';

export const PUBLIC_ROUTE = 'auth:public';
export const REQUIRED_PERMISSIONS = 'auth:permissions';
export const REQUIRE_ANY_PERMISSION = 'auth:any-permission';
export const RATE_LIMIT = 'auth:rate-limit';

export const Public = () => SetMetadata(PUBLIC_ROUTE, true);
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(REQUIRED_PERMISSIONS, permissions);
export const RequireAnyPermission = (...permissions: PermissionCode[]) =>
  SetMetadata(REQUIRE_ANY_PERMISSION, permissions);
export const RateLimit = (limit: number, windowSeconds: number) =>
  SetMetadata(RATE_LIMIT, { limit, windowSeconds });

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  return context.switchToHttp().getRequest<AuthenticatedRequest>().auth;
});
