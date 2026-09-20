import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, type UserRepository } from '../ports';
import { UserNotFoundException } from '../../domain';

export class DeactivateUserCommand {
  constructor(readonly userId: string) {}
}

@Injectable()
export class DeactivateUserHandler {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(command: DeactivateUserCommand): Promise<void> {
    const user = await this.users.findById(command.userId);
    if (!user) throw new UserNotFoundException();
    const updated = user.deactivate(new Date());
    if (updated !== user) await this.users.updateStatus(updated);
  }
}
