import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, type UserRepository } from '../ports';

export class ActivateUserCommand {
  constructor(readonly userId: string) {}
}

@Injectable()
export class ActivateUserHandler {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(command: ActivateUserCommand): Promise<void> {
    await this.users.activate(command.userId);
  }
}
