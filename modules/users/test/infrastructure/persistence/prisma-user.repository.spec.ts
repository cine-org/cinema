import { describe, expect, it, vi } from 'vitest';
import type { DatabaseClient } from '@repo/database';
import { PrismaUserRepository } from '../../../src/infrastructure';

describe('PrismaUserRepository lifecycle', () => {
  it('does not update statusChangedAt when target status is already current', async () => {
    const db = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ status: 'ACTIVE' }),
        update: vi.fn(),
      },
    } as unknown as DatabaseClient;
    const repository = new PrismaUserRepository(db);

    await repository.activate('user-id');

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      select: { status: true },
    });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('updates status and statusChangedAt when status changes', async () => {
    const db = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ status: 'ACTIVE' }),
        update: vi.fn(),
      },
    } as unknown as DatabaseClient;
    const repository = new PrismaUserRepository(db);

    await repository.suspend('user-id');

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: {
        status: 'SUSPENDED',
        statusChangedAt: expect.any(Date),
      },
    });
  });
});
