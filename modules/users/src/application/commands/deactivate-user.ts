import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, type UserRepository } from '../ports';

export class DeactivateUserCommand {
  constructor(readonly userId: string) {}
}

@Injectable()
export class DeactivateUserHandler {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(command: DeactivateUserCommand): Promise<void> {
    await this.users.deactivate(command.userId);
  }
}
