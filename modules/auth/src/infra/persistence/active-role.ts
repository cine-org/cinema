import type { Prisma } from '@repo/database';

// The account's active role (at most one, by a partial unique index) and the scope it was granted
// at.
export const ACTIVE_ROLE = {
  where: { revokedAt: null },
  take: 1,
  select: { scope: true, role: { select: { key: true } } },
} satisfies Prisma.User$roleAssignmentsArgs;

// The active role with where it applies and its current, non-deprecated permissions.
export const ACTIVE_GRANT = {
  where: { revokedAt: null },
  take: 1,
  select: {
    scope: true,
    clusterId: true,
    theaterId: true,
    role: {
      select: {
        key: true,
        permissions: {
          where: { permission: { deprecatedAt: null } },
          select: { permissionKey: true },
        },
      },
    },
  },
} satisfies Prisma.User$roleAssignmentsArgs;
