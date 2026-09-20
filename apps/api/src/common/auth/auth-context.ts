import type { AuthPrincipal } from '@repo/contracts';
import type { AuthenticatedUser } from '@repo/auth';
import type { Request } from 'express';

export type AuthenticatedRequest = Request & {
  auth?: AuthPrincipal;
  authUser?: AuthenticatedUser;
};
