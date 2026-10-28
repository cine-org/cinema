import { describe, expect, it } from 'vitest';
import {
  PERMISSION_KEYS,
  permissionModule,
  ROLE_SCOPE,
  SYSTEM_ROLE_KEYS,
  SYSTEM_ROLES,
} from '../../src/domain';

describe('permission catalog', () => {
  it('names every permission resource:action, with an optional .own or .any', () => {
    for (const key of PERMISSION_KEYS) {
      expect(key).toMatch(/^[a-z]+(-[a-z]+)*:[a-z]+(-[a-z]+)*(\.(own|any))?$/);
    }
  });

  it('groups a permission by the resource before the colon', () => {
    expect(permissionModule('room-layouts:upsert-draft')).toBe('room-layouts');
    expect(permissionModule('users:read.any')).toBe('users');
  });
});

describe('system roles', () => {
  it('locks SUPER_ADMIN only', () => {
    expect(SYSTEM_ROLE_KEYS.filter((key) => SYSTEM_ROLES[key].locked)).toEqual(['SUPER_ADMIN']);
  });

  it('can be granted somewhere', () => {
    for (const key of SYSTEM_ROLE_KEYS) {
      expect(SYSTEM_ROLES[key].scopes.length).toBeGreaterThan(0);
    }
  });

  it('keeps SELF for customers and customers to SELF', () => {
    const self = SYSTEM_ROLE_KEYS.filter((key) =>
      SYSTEM_ROLES[key].scopes.includes(ROLE_SCOPE.SELF),
    );
    expect(self).toEqual(['CUSTOMER']);
    expect(SYSTEM_ROLES.CUSTOMER.scopes).toEqual([ROLE_SCOPE.SELF]);
  });

  it('lists each default permission once', () => {
    for (const key of SYSTEM_ROLE_KEYS) {
      const defaults = SYSTEM_ROLES[key].defaultPermissions;
      expect(new Set(defaults).size).toBe(defaults.length);
    }
  });
});
