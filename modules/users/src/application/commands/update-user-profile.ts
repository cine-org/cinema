import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundException } from '../../domain';
import { USER_REPOSITORY, type UserRepository } from '../ports';

export type UpdateUserProfileCommandProps = {
  readonly userId: string;
  readonly fullName?: string | null;
  readonly avatarUrl?: string | null;
  readonly dateOfBirth?: Date | null;
};

export class UpdateUserProfileCommand {
  constructor(readonly props: UpdateUserProfileCommandProps) {}
}

@Injectable()
export class UpdateUserProfileHandler {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(command: UpdateUserProfileCommand): Promise<void> {
    const user = await this.users.findById(command.props.userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    await this.users.updateProfile(
      user.updateProfile({
        fullName: command.props.fullName,
        avatarUrl: command.props.avatarUrl,
        dateOfBirth: command.props.dateOfBirth,
        updatedAt: new Date(),
      }),
    );
  }
}
