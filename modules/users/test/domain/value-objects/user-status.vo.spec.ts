import { describe, expect, it } from 'vitest';
import { UserInvalidException, UserStatus } from '../../../src/domain';

describe('UserStatus', () => {
  it.each([
    ['PENDING_VERIFICATION', 'isPendingVerification'],
    ['ACTIVE', 'isActive'],
    ['DEACTIVATED', 'isDeactivated'],
    ['SUSPENDED', 'isSuspended'],
  ] as const)('creates %s', (value, helper) => {
    const status = UserStatus.create(value);

    expect(status.value).toBe(value);
    expect(status[helper]()).toBe(true);
  });

  it('throws for invalid values', () => {
    expect(() => UserStatus.create('DELETED')).toThrow(UserInvalidException);
  });
});
