import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '@repo/iam';

export const ADMIN_ACCESS = 'api:admin-access';
export const REQUIRED_PERMISSION = 'api:required-permission';

// Who may call an admin route. Every admin route is closed by default: it needs an admin session
// and the permission it declares with @RequirePermission (SUPER_ADMIN only when it declares none).
export type AdminAccess = 'public' | 'any-internal-role';

// No session needed: signing in, refreshing and logging out.
export const PublicAdminRoute = () => SetMetadata(ADMIN_ACCESS, 'public' satisfies AdminAccess);

// Any internal account, whatever its role: its own sessions, for instance.
export const AnyInternalRole = () =>
  SetMetadata(ADMIN_ACCESS, 'any-internal-role' satisfies AdminAccess);

// What a route acts on, for cluster and theater grants (see decideAccess in @repo/iam):
// - omitted: nothing tied to a theater, so GLOBAL grants only;
// - 'any-scope': data every theater shares, so any internal grant with the permission;
// - 'list': several theaters, narrowed to the caller's (read it with @TheaterScopeParam);
// - { theater | room | seat | theaterSlug: param }: the theater owning that route param, and its
//   cluster.
export type PermissionTarget =
  | 'any-scope'
  | 'list'
  | { readonly theater: string }
  | { readonly theaterSlug: string }
  | { readonly room: string }
  | { readonly seat: string };

export type RequiredPermission = {
  readonly permission: PermissionKey;
  readonly target?: PermissionTarget;
};

export const RequirePermission = (permission: PermissionKey, target?: PermissionTarget) =>
  SetMetadata(REQUIRED_PERMISSION, { permission, target } satisfies RequiredPermission);
