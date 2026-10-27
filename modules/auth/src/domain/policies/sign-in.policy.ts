import { isInternalScope, SYSTEM_ROLE, type RoleScope } from '@repo/iam';
import { AUTH_SESSION_SURFACE, type AuthSessionSurface } from './auth-session.policy';

// Customers sign in on the user side only, internal accounts on the admin side only: an account
// is never both.
export function canSignInOn(
  surface: AuthSessionSurface,
  role: { readonly key: string; readonly scope: RoleScope } | null,
): boolean {
  if (!role) return false;
  return surface === AUTH_SESSION_SURFACE.USER
    ? role.key === SYSTEM_ROLE.CUSTOMER
    : isInternalScope(role.scope);
}
