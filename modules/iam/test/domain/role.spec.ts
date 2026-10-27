import { describe, expect, it } from 'vitest';
import {
  assertGrantable,
  InvalidRoleException,
  NotInternalRoleException,
  Role,
  RoleLockedException,
  RoleScopeMismatchException,
  UnknownPermissionException,
} from '../../src/domain';

const active = new Set(['theaters:read', 'rooms:read', 'rooms:create']);

const custom = (input: Partial<Parameters<typeof Role.create>[0]> = {}) =>
  Role.create({
    id: 'r1',
    key: 'NIGHT_SUPERVISOR',
    name: '  Night supervisor ',
    scopes: ['THEATER'],
    permissions: ['theaters:read'],
    active,
    ...input,
  });

describe('Role.create', () => {
  it('makes a custom role with a trimmed name', () => {
    const role = custom();

    expect([role.key, role.name, role.scopes, role.permissions]).toEqual([
      'NIGHT_SUPERVISOR',
      'Night supervisor',
      ['THEATER'],
      ['theaters:read'],
    ]);
  });

  it.each([
    ['a system role key', { key: 'USHER' }],
    ['a lower case key', { key: 'night' }],
    ['no scope', { scopes: [] }],
    ['the customer scope', { scopes: ['SELF' as const] }],
    ['an empty name', { name: '  ' }],
  ])('refuses %s', (_, input) => {
    expect(() => custom(input)).toThrow(InvalidRoleException);
  });

  it('refuses permissions the catalog does not have', () => {
    expect(() => custom({ permissions: ['theaters:fly'] })).toThrow(UnknownPermissionException);
  });
});

describe('Role.replacePermissions', () => {
  it('reports what it added and removed', () => {
    const role = custom();

    expect(role.replacePermissions(['rooms:read', 'rooms:create'], active)).toEqual({
      added: ['rooms:create', 'rooms:read'],
      removed: ['theaters:read'],
    });
  });

  it('refuses a locked role', () => {
    const superAdmin = Role.restore({
      id: 'r0',
      key: 'SUPER_ADMIN',
      name: 'Super admin',
      scopes: ['GLOBAL'],
      isSystem: true,
      isLocked: true,
      permissions: new Set(active),
    });

    expect(() => superAdmin.replacePermissions([], active)).toThrow(RoleLockedException);
  });
});

describe('assertGrantable', () => {
  const usher = { scopes: ['THEATER' as const] };
  const support = { scopes: ['GLOBAL' as const, 'CLUSTER' as const, 'THEATER' as const] };

  it('accepts a scope the role allows, pointing at what it names', () => {
    expect(() =>
      assertGrantable(support, { scope: 'CLUSTER', clusterId: 'c1', theaterId: null }),
    ).not.toThrow();
    expect(() =>
      assertGrantable(support, { scope: 'GLOBAL', clusterId: null, theaterId: null }),
    ).not.toThrow();
  });

  it('refuses the customer role', () => {
    expect(() =>
      assertGrantable({ scopes: ['SELF'] }, { scope: 'SELF', clusterId: null, theaterId: null }),
    ).toThrow(NotInternalRoleException);
  });

  it.each([
    [
      'a scope the role forbids',
      usher,
      { scope: 'GLOBAL' as const, clusterId: null, theaterId: null },
    ],
    [
      'a theater grant without a theater',
      usher,
      { scope: 'THEATER' as const, clusterId: null, theaterId: null },
    ],
    [
      'a cluster grant with a theater',
      support,
      { scope: 'CLUSTER' as const, clusterId: 'c1', theaterId: 't1' },
    ],
    [
      'a global grant with a theater',
      support,
      { scope: 'GLOBAL' as const, clusterId: null, theaterId: 't1' },
    ],
  ])('refuses %s', (_, role, place) => {
    expect(() => assertGrantable(role, place)).toThrow(RoleScopeMismatchException);
  });
});
