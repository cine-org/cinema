import { Injectable } from '@nestjs/common';
import { GetUserByIdHandler, GetUserByIdQuery, type UserView } from '@repo/users';

// One entry point for the module's handlers; controllers never touch a handler directly.
@Injectable()
export class UsersService {
  constructor(private readonly getUserById: GetUserByIdHandler) {}

  async findById(id: string): Promise<UserView> {
    return this.getUserById.execute(new GetUserByIdQuery(id));
  }
}
