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

const createRepository = (): UserRepository =>
  ({
    findById: vi.fn(),
    paginate: vi.fn(),
    updateProfile: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
    suspend: vi.fn(),
  }) as unknown as UserRepository;

describe('user lifecycle handlers', () => {
  it('activates a user', async () => {
    const users = createRepository();
    const handler = new ActivateUserHandler(users);

    await handler.execute(new ActivateUserCommand('user-id'));

    expect(users.activate).toHaveBeenCalledWith('user-id');
  });

  it('deactivates a user', async () => {
    const users = createRepository();
    const handler = new DeactivateUserHandler(users);

    await handler.execute(new DeactivateUserCommand('user-id'));

    expect(users.deactivate).toHaveBeenCalledWith('user-id');
  });

  it('suspends a user', async () => {
    const users = createRepository();
    const handler = new SuspendUserHandler(users);

    await handler.execute(new SuspendUserCommand('user-id'));

    expect(users.suspend).toHaveBeenCalledWith('user-id');
  });
});
