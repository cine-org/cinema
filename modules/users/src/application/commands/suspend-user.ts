import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, type UserRepository } from '../ports';

export class SuspendUserCommand {
  constructor(readonly userId: string) {}
}

@Injectable()
export class SuspendUserHandler {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(command: SuspendUserCommand): Promise<void> {
    await this.users.suspend(command.userId);
  }
}
