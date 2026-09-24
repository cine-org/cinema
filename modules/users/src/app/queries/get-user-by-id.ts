import { Injectable } from '@nestjs/common';
import { UserNotFoundException } from '../../domain';
import { UserReadRepository } from '../ports';
import type { UserView } from '../views';

export class GetUserByIdQuery {
  constructor(readonly userId: string) {}
}

@Injectable()
export class GetUserByIdHandler {
  constructor(private readonly users: UserReadRepository) {}

  async execute(query: GetUserByIdQuery): Promise<UserView> {
    const user = await this.users.findById(query.userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }
}
