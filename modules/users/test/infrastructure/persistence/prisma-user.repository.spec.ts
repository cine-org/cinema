import { describe, expect, it, vi } from 'vitest';
import type { DatabaseClient } from '@repo/database';
import { PrismaUserRepository } from '../../../src/infrastructure';
import { User, UserStatus } from '../../../src/domain';

describe('PrismaUserRepository lifecycle', () => {
  it('persists status chosen by the domain entity', async () => {
    const db = {
      user: {
        update: vi.fn(),
      },
    } as unknown as DatabaseClient;
    const repository = new PrismaUserRepository(db);

    const changedAt = new Date('2026-09-18T00:00:00Z');
    const user = User.restore({
      id: 'user-id',
      username: 'viewer',
      normalizedUsername: 'viewer',
      status: UserStatus.suspended(),
      statusChangedAt: changedAt,
      createdAt: changedAt,
      updatedAt: changedAt,
    });
    await repository.updateStatus(user);

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: {
        status: 'SUSPENDED',
        statusChangedAt: changedAt,
      },
    });
  });
});
