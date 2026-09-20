import { describe, expect, it } from 'vitest';
import { User, UserInvalidStatusTransitionException, UserStatus } from '../../src/domain';

const restore = (status: UserStatus) =>
  User.restore({
    id: 'user-id',
    username: 'viewer',
    normalizedUsername: 'viewer',
    status,
    statusChangedAt: new Date('2026-01-01'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });

describe('User lifecycle', () => {
  it('allows active users to be suspended and reactivated', () => {
    const now = new Date('2026-09-19');
    const suspended = restore(UserStatus.active()).suspend(now);
    expect(suspended.isSuspended()).toBe(true);
    expect(suspended.activate(now).isActive()).toBe(true);
  });

  it('does not let administration bypass pending email verification', () => {
    expect(() => restore(UserStatus.pendingVerification()).activate(new Date())).toThrow(
      UserInvalidStatusTransitionException,
    );
  });

  it('requires an active user before suspension', () => {
    expect(() => restore(UserStatus.deactivated()).suspend(new Date())).toThrow(
      UserInvalidStatusTransitionException,
    );
  });
});
