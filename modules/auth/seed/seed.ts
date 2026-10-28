// Dev/test data only, never run against prod. Idempotent, so `pnpm db:seed` can run any time.
import { Email } from '@repo/common';
import { DatabaseWriteClient } from '@repo/database';
import { ROLE_SCOPE, SYSTEM_ROLE, type RoleScope, type SystemRoleKey } from '@repo/iam';
import { Account } from '../src/domain';
import { Argon2PasswordHasher } from '../src/infra';

type AccountSeed = {
  readonly email: string;
  readonly password: string;
  readonly fullName: string;
  readonly role: SystemRoleKey;
  readonly scope: RoleScope;
  // Seeded by @repo/theaters, which runs first (see turbo.json).
  readonly cluster?: string;
  readonly theater?: string;
};

const STAFF_PASSWORD = 'staff12345';
const CUSTOMER_PASSWORD = 'customer12345';

// Two accounts per role. Cluster and theater roles are spread over the seeded clusters and theaters.
const ACCOUNTS: AccountSeed[] = [
  {
    email: 'admin@cinema.local',
    password: 'admin12345',
    fullName: 'Admin',
    role: SYSTEM_ROLE.SUPER_ADMIN,
    scope: ROLE_SCOPE.GLOBAL,
  },
  {
    email: 'admin2@cinema.local',
    password: 'admin12345',
    fullName: 'Admin 2',
    role: SYSTEM_ROLE.SUPER_ADMIN,
    scope: ROLE_SCOPE.GLOBAL,
  },
  {
    email: 'content1@cinema.local',
    password: STAFF_PASSWORD,
    fullName: 'Content 1',
    role: SYSTEM_ROLE.CONTENT_MANAGER,
    scope: ROLE_SCOPE.GLOBAL,
  },
  {
    email: 'content2@cinema.local',
    password: STAFF_PASSWORD,
    fullName: 'Content 2',
    role: SYSTEM_ROLE.CONTENT_MANAGER,
    scope: ROLE_SCOPE.GLOBAL,
  },
  {
    email: 'support1@cinema.local',
    password: STAFF_PASSWORD,
    fullName: 'Support 1',
    role: SYSTEM_ROLE.CUSTOMER_SUPPORT,
    scope: ROLE_SCOPE.GLOBAL,
  },
  {
    email: 'support2@cinema.local',
    password: STAFF_PASSWORD,
    fullName: 'Support 2',
    role: SYSTEM_ROLE.CUSTOMER_SUPPORT,
    scope: ROLE_SCOPE.CLUSTER,
    cluster: 'Hồ Chí Minh',
  },
  {
    email: 'cluster1@cinema.local',
    password: STAFF_PASSWORD,
    fullName: 'Cluster 1',
    role: SYSTEM_ROLE.CLUSTER_MANAGER,
    scope: ROLE_SCOPE.CLUSTER,
    cluster: 'Hồ Chí Minh',
  },
  {
    email: 'cluster2@cinema.local',
    password: STAFF_PASSWORD,
    fullName: 'Cluster 2',
    role: SYSTEM_ROLE.CLUSTER_MANAGER,
    scope: ROLE_SCOPE.CLUSTER,
    cluster: 'Hà Nội',
  },
  {
    email: 'manager1@cinema.local',
    password: STAFF_PASSWORD,
    fullName: 'Manager 1',
    role: SYSTEM_ROLE.THEATER_MANAGER,
    scope: ROLE_SCOPE.THEATER,
    theater: 'cinema-thao-dien',
  },
  {
    email: 'manager2@cinema.local',
    password: STAFF_PASSWORD,
    fullName: 'Manager 2',
    role: SYSTEM_ROLE.THEATER_MANAGER,
    scope: ROLE_SCOPE.THEATER,
    theater: 'cinema-hoan-kiem',
  },
  {
    email: 'boxoffice1@cinema.local',
    password: STAFF_PASSWORD,
    fullName: 'Box office 1',
    role: SYSTEM_ROLE.BOX_OFFICE,
    scope: ROLE_SCOPE.THEATER,
    theater: 'cinema-thao-dien',
  },
  {
    email: 'boxoffice2@cinema.local',
    password: STAFF_PASSWORD,
    fullName: 'Box office 2',
    role: SYSTEM_ROLE.BOX_OFFICE,
    scope: ROLE_SCOPE.THEATER,
    theater: 'cinema-hoan-kiem',
  },
  {
    email: 'usher1@cinema.local',
    password: STAFF_PASSWORD,
    fullName: 'Usher 1',
    role: SYSTEM_ROLE.USHER,
    scope: ROLE_SCOPE.THEATER,
    theater: 'cinema-thao-dien',
  },
  {
    email: 'usher2@cinema.local',
    password: STAFF_PASSWORD,
    fullName: 'Usher 2',
    role: SYSTEM_ROLE.USHER,
    scope: ROLE_SCOPE.THEATER,
    theater: 'cinema-son-tra',
  },
  {
    email: 'customer@cinema.local',
    password: CUSTOMER_PASSWORD,
    fullName: 'Customer',
    role: SYSTEM_ROLE.CUSTOMER,
    scope: ROLE_SCOPE.SELF,
  },
  {
    email: 'customer2@cinema.local',
    password: CUSTOMER_PASSWORD,
    fullName: 'Customer 2',
    role: SYSTEM_ROLE.CUSTOMER,
    scope: ROLE_SCOPE.SELF,
  },
];

// Seeded accounts are already verified: no code, no Redis, no mail. Email and password go through
// the same normalization and Argon2 hashing as registration. An existing account keeps its password
// but gets the role listed here back, the previous one revoked.
async function seed(url: string): Promise<void> {
  const db = new DatabaseWriteClient({ url });
  const hasher = new Argon2PasswordHasher();

  for (const input of ACCOUNTS) {
    const email = Email.create(input.email);
    const target = {
      scope: input.scope,
      clusterId: input.cluster
        ? (await db.cluster.findUniqueOrThrow({ where: { name: input.cluster } })).id
        : null,
      theaterId: input.theater
        ? (await db.theater.findUniqueOrThrow({ where: { slug: input.theater } })).id
        : null,
    };

    const assignment = {
      role: { connect: { key: input.role } },
      scope: target.scope,
      ...(target.clusterId ? { cluster: { connect: { id: target.clusterId } } } : {}),
      ...(target.theaterId ? { theater: { connect: { id: target.theaterId } } } : {}),
    };

    const existing = await db.user.findUnique({
      where: { email: email.value },
      select: {
        id: true,
        roleAssignments: {
          where: { revokedAt: null },
          select: {
            id: true,
            scope: true,
            clusterId: true,
            theaterId: true,
            role: { select: { key: true } },
          },
        },
      },
    });

    if (!existing) {
      await db.user.create({
        data: {
          id: Account.newId(),
          email: email.value,
          passwordHash: await hasher.hash(input.password),
          fullName: input.fullName,
          isEmailVerified: true,
          roleAssignments: { create: assignment },
        },
      });
      console.log(`seeded account ${email.value} (${input.role})`);
      continue;
    }

    const active = existing.roleAssignments[0];
    if (
      active?.role.key === input.role &&
      active.scope === target.scope &&
      active.clusterId === target.clusterId &&
      active.theaterId === target.theaterId
    ) {
      continue;
    }

    await db.$transaction([
      db.roleAssignment.updateMany({
        where: { userId: existing.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      db.roleAssignment.create({
        data: { user: { connect: { id: existing.id } }, ...assignment },
      }),
    ]);
    console.log(`seeded role ${input.role} for ${email.value}`);
  }

  await db.$disconnect();
}

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL is required to seed; run `pnpm db:seed` from the root');
  process.exit(1);
}

seed(url)
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
