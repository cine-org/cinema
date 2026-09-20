import { describe, expect, it, vi } from 'vitest';
import {
  ActivateUserCommand,
  ActivateUserHandler,
  DeactivateUserCommand,
  DeactivateUserHandler,
  SuspendUserCommand,
  SuspendUserHandler,
  type UserRepository,
} from '../../../src/application';
import { User, UserStatus } from '../../../src/domain';

const user = (status: UserStatus) =>
  User.restore({
    id: 'user-id',
    username: 'viewer',
    normalizedUsername: 'viewer',
    status,
    statusChangedAt: new Date('2026-01-01'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });

const createRepository = (): UserRepository =>
  ({
    findById: vi.fn(),
    paginate: vi.fn(),
    updateProfile: vi.fn(),
    updateStatus: vi.fn(),
  }) as unknown as UserRepository;

describe('user lifecycle handlers', () => {
  it('activates a user', async () => {
    const users = createRepository();
    vi.mocked(users.findById).mockResolvedValue(user(UserStatus.deactivated()));
    const handler = new ActivateUserHandler(users);

    await handler.execute(new ActivateUserCommand('user-id'));

    expect(users.updateStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-id' }));
    expect(vi.mocked(users.updateStatus).mock.calls[0]?.[0].isActive()).toBe(true);
  });

  it('deactivates a user', async () => {
    const users = createRepository();
    vi.mocked(users.findById).mockResolvedValue(user(UserStatus.active()));
    const handler = new DeactivateUserHandler(users);

    await handler.execute(new DeactivateUserCommand('user-id'));

    expect(vi.mocked(users.updateStatus).mock.calls[0]?.[0].isDeactivated()).toBe(true);
  });

  it('suspends a user', async () => {
    const users = createRepository();
    vi.mocked(users.findById).mockResolvedValue(user(UserStatus.active()));
    const handler = new SuspendUserHandler(users);

    await handler.execute(new SuspendUserCommand('user-id'));

    expect(vi.mocked(users.updateStatus).mock.calls[0]?.[0].isSuspended()).toBe(true);
  });
});
