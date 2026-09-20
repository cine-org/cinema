import { Inject, Injectable } from '@nestjs/common';
import { type User, UserNotFoundException } from '../../domain';
import { USER_REPOSITORY, type UserRepository } from '../ports';

export class GetUserByIdQuery {
  constructor(readonly userId: string) {}
}

@Injectable()
export class GetUserByIdHandler {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(query: GetUserByIdQuery): Promise<User> {
    const user = await this.users.findById(query.userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }
}
