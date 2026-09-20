import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, type UserRepository } from '../ports';
import { UserNotFoundException } from '../../domain';

export class SuspendUserCommand {
  constructor(readonly userId: string) {}
}

@Injectable()
export class SuspendUserHandler {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(command: SuspendUserCommand): Promise<void> {
    const user = await this.users.findById(command.userId);
    if (!user) throw new UserNotFoundException();
    const updated = user.suspend(new Date());
    if (updated !== user) await this.users.updateStatus(updated);
  }
}
