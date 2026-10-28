import { describe, expect, it } from 'vitest';
import {
  InvalidRoleException,
  Role,
  RoleKeyTakenException,
  RoleLockedException,
  UnknownPermissionException,
  type NewRole,
} from '../../src/domain';

const catalog = new Set(['theaters:read', 'rooms:read', 'rooms:create']);

const custom = (input: Partial<NewRole> = {}) =>
  Role.create(
    {
      key: ' night_supervisor ',
      name: '  Night supervisor ',
      scopes: ['THEATER', 'THEATER'],
      permissions: ['theaters:read'],
      ...input,
    },
    catalog,
  );

describe('Role.create', () => {
  it('makes an unlocked custom role with a normalized key and name', () => {
    const role = custom();

    expect([role.key, role.name, role.scopes, role.permissions]).toEqual([
      'NIGHT_SUPERVISOR',
      'Night supervisor',
      ['THEATER'],
      ['theaters:read'],
    ]);
    expect([role.isSystem, role.isLocked]).toEqual([false, false]);
  });

  it('refuses the key of a system role', () => {
    expect(() => custom({ key: 'usher' })).toThrow(RoleKeyTakenException);
  });

  it.each([
    ['a key with spaces', { key: 'NIGHT SHIFT' }],
    ['a one letter key', { key: 'N' }],
    ['a key starting with a digit', { key: '1ST_SHIFT' }],
    ['an empty name', { name: '  ' }],
    ['a name over 60 characters', { name: 'x'.repeat(61) }],
    ['no scope', { scopes: [] }],
    ['the customer scope', { scopes: ['THEATER', 'SELF'] as const }],
  ])('refuses %s', (_, input) => {
    expect(() => custom(input)).toThrow(InvalidRoleException);
  });

  it('refuses a permission outside the catalog', () => {
    expect(() => custom({ permissions: ['theaters:fly'] })).toThrow(UnknownPermissionException);
  });
});

describe('Role.replacePermissions', () => {
  it('replaces the whole set and reports what changed', () => {
    const role = custom();

    expect(role.replacePermissions(['rooms:read', 'rooms:create'], catalog)).toEqual({
      added: ['rooms:create', 'rooms:read'],
      removed: ['theaters:read'],
    });
    expect(role.permissions).toEqual(['rooms:create', 'rooms:read']);
  });

  it('refuses a locked role', () => {
    const superAdmin = Role.restore({
      id: 'r0',
      key: 'SUPER_ADMIN',
      name: 'Super admin',
      scopes: ['GLOBAL'],
      isSystem: true,
      isLocked: true,
      permissions: new Set(catalog),
    });

    expect(() => superAdmin.replacePermissions([], catalog)).toThrow(RoleLockedException);
  });

  it('refuses a permission outside the catalog and keeps the old set', () => {
    const role = custom();

    expect(() => role.replacePermissions(['theaters:fly'], catalog)).toThrow(
      UnknownPermissionException,
    );
    expect(role.permissions).toEqual(['theaters:read']);
  });
});
