import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, type UserRepository } from '../ports';
import { UserNotFoundException } from '../../domain';

export class ActivateUserCommand {
  constructor(readonly userId: string) {}
}

@Injectable()
export class ActivateUserHandler {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(command: ActivateUserCommand): Promise<void> {
    const user = await this.users.findById(command.userId);
    if (!user) throw new UserNotFoundException();
    const updated = user.activate(new Date());
    if (updated !== user) await this.users.updateStatus(updated);
  }
}
