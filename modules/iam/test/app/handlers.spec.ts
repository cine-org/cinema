import { describe, expect, it, vi } from 'vitest';
import {
  ChangeUserRoleCommand,
  ChangeUserRoleHandler,
  CreateRoleCommand,
  CreateRoleHandler,
  GetRoleHandler,
  GetRoleQuery,
  ReplaceRolePermissionsCommand,
  ReplaceRolePermissionsHandler,
  type AccessGrantRepository,
  type IamReadRepository,
  type RoleAssignmentRepository,
  type RoleRepository,
} from '../../src/app';
import {
  AccountNotFoundException,
  ClusterNotFoundException,
  LastAdminException,
  Role,
  RoleNotFoundException,
  RoleScopeMismatchException,
  SelfRoleChangeException,
  TheaterUnavailableException,
  type AccessGrant,
  type CurrentRole,
} from '../../src/domain';

const catalog = new Set(['theaters:read', 'rooms:read']);

const systemRole = (key: string) =>
  Role.restore({
    id: `id-${key}`,
    key,
    name: key,
    scopes: ['THEATER'],
    isSystem: true,
    isLocked: false,
    permissions: new Set(['theaters:read']),
  });

// Runs the callback on `role`, as modify() does under its lock.
function rolesWith(role: Role | null) {
  return {
    findCatalog: vi.fn(async () => catalog),
    create: vi.fn(),
    modify: vi.fn(async (_id: string, change: (r: Role, c: ReadonlySet<string>) => unknown) =>
      role ? change(role, catalog) : null,
    ),
  } satisfies Record<keyof RoleRepository, unknown>;
}

const actorHolding = (roleKey: string | null) =>
  ({
    findActive: vi.fn(async () => (roleKey ? ({ roleKey } as AccessGrant) : null)),
  }) satisfies AccessGrantRepository;

describe('CreateRoleHandler', () => {
  it('saves a new custom role and returns its id', async () => {
    const roles = rolesWith(null);
    const handler = new CreateRoleHandler(roles as unknown as RoleRepository);

    const { roleId } = await handler.execute(
      new CreateRoleCommand('NIGHT', 'Night', ['THEATER'], ['rooms:read']),
    );

    const saved = roles.create.mock.calls[0]![0] as Role;
    expect([saved.id, saved.key, saved.permissions]).toEqual([roleId, 'NIGHT', ['rooms:read']]);
  });
});

describe('ReplaceRolePermissionsHandler', () => {
  const replace = (role: Role | null, actorRole: string | null = 'SUPER_ADMIN') =>
    new ReplaceRolePermissionsHandler(
      rolesWith(role) as unknown as RoleRepository,
      actorHolding(actorRole),
    ).execute(new ReplaceRolePermissionsCommand('actor', 'role', ['rooms:read']));

  it('returns what changed', async () => {
    await expect(replace(systemRole('USHER'))).resolves.toEqual({
      added: ['rooms:read'],
      removed: ['theaters:read'],
    });
  });

  it('refuses an unknown role and the customer role alike', async () => {
    await expect(replace(null)).rejects.toThrow(RoleNotFoundException);
    await expect(replace(systemRole('CUSTOMER'))).rejects.toThrow(RoleNotFoundException);
  });

  it("refuses the caller's own role", async () => {
    await expect(replace(systemRole('USHER'), 'USHER')).rejects.toThrow(SelfRoleChangeException);
  });
});

describe('ChangeUserRoleHandler', () => {
  const usher = { id: 'id-USHER', key: 'USHER', scopes: ['THEATER' as const] };

  function assignmentsWith(current: CurrentRole | null, overrides = {}) {
    return {
      findRoleByKey: vi.fn(async () => usher),
      clusterExists: vi.fn(async () => true),
      isOpenTheater: vi.fn(async () => true),
      changeRole: vi.fn(async (_change, check: (c: CurrentRole) => void) => {
        if (!current) return false;
        check(current);
        return true;
      }),
      ...overrides,
    } satisfies RoleAssignmentRepository;
  }

  const change = (
    assignments: RoleAssignmentRepository,
    input: Partial<ChangeUserRoleCommand> = {},
  ) => {
    const command = {
      actorId: 'admin',
      accountId: 'staff',
      roleKey: 'USHER',
      scope: 'THEATER' as const,
      clusterId: null,
      theaterId: 't1',
      ...input,
    };
    return new ChangeUserRoleHandler(assignments).execute(
      new ChangeUserRoleCommand(
        command.actorId,
        command.accountId,
        command.roleKey,
        command.scope,
        command.clusterId,
        command.theaterId,
      ),
    );
  };

  const box = { roleKey: 'BOX_OFFICE', otherAdmins: null };

  it('swaps the role where it fits', async () => {
    const assignments = assignmentsWith(box);

    await change(assignments);

    expect(assignments.changeRole.mock.calls[0]![0]).toMatchObject({
      accountId: 'staff',
      actorId: 'admin',
      role: usher,
      scope: 'THEATER',
      theaterId: 't1',
    });
  });

  it("refuses the caller's own account before reading anything", async () => {
    const assignments = assignmentsWith(box);

    await expect(change(assignments, { accountId: 'admin' })).rejects.toThrow(
      SelfRoleChangeException,
    );
    expect(assignments.findRoleByKey).not.toHaveBeenCalled();
  });

  it('refuses an unknown role', async () => {
    const assignments = assignmentsWith(box, { findRoleByKey: vi.fn(async () => null) });

    await expect(change(assignments)).rejects.toThrow(RoleNotFoundException);
  });

  it('refuses a place that does not fit the role', async () => {
    await expect(
      change(assignmentsWith(box), { scope: 'GLOBAL', theaterId: null }),
    ).rejects.toThrow(RoleScopeMismatchException);
  });

  it('refuses an unknown cluster and an unavailable theater', async () => {
    const support = { id: 'id-CS', key: 'CUSTOMER_SUPPORT', scopes: ['CLUSTER' as const] };
    const noCluster = assignmentsWith(box, {
      findRoleByKey: vi.fn(async () => support),
      clusterExists: vi.fn(async () => false),
    });
    const closed = assignmentsWith(box, { isOpenTheater: vi.fn(async () => false) });

    await expect(
      change(noCluster, {
        roleKey: 'CUSTOMER_SUPPORT',
        scope: 'CLUSTER',
        clusterId: 'c1',
        theaterId: null,
      }),
    ).rejects.toThrow(ClusterNotFoundException);
    await expect(change(closed)).rejects.toThrow(TheaterUnavailableException);
  });

  it('refuses an account that does not exist or holds no role', async () => {
    await expect(change(assignmentsWith(null))).rejects.toThrow(AccountNotFoundException);
  });

  it('passes the current role to the check, which keeps the last SUPER_ADMIN', async () => {
    await expect(
      change(assignmentsWith({ roleKey: 'SUPER_ADMIN', otherAdmins: 0 })),
    ).rejects.toThrow(LastAdminException);
  });
});

describe('GetRoleHandler', () => {
  it('refuses a role the repository does not find', async () => {
    const iam = {
      listPermissions: vi.fn(),
      listRoles: vi.fn(),
      findRole: vi.fn(async () => null),
    } satisfies IamReadRepository;

    await expect(new GetRoleHandler(iam).execute(new GetRoleQuery('nope'))).rejects.toThrow(
      RoleNotFoundException,
    );
  });
});
