import { describe, expect, it } from 'vitest';
import { Role, RoleCode, RoleType, SystemRoleImmutableException } from '../../src/domain';

describe('Role', () => {
  it('does not allow a system role to be updated', () => {
    const role = Role.restore({
      id: 'role-id',
      code: RoleCode.create('SUPER_ADMIN'),
      type: RoleType.system(),
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    });
    expect(() => role.update({ name: 'Changed', updatedAt: new Date() })).toThrow(
      SystemRoleImmutableException,
    );
  });

  it('allows a custom role to be updated without erasing omitted fields', () => {
    const role = Role.create({
      id: 'role-id',
      code: RoleCode.create('CONTENT_EDITOR'),
      name: 'Editor',
      description: 'Can edit',
      now: new Date('2026-01-01'),
    });
    const updated = role.update({ description: 'Updated', updatedAt: new Date('2026-02-01') });
    expect(updated.name).toBe('Editor');
    expect(updated.description).toBe('Updated');
  });
});
