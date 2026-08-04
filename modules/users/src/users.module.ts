import { Module } from '@nestjs/common';
import {
  ActivateUserHandler,
  DeactivateUserHandler,
  GetUserByIdHandler,
  GetUsersPageHandler,
  SuspendUserHandler,
  UpdateUserProfileHandler,
  USER_REPOSITORY,
} from './application';
import { PrismaUserRepository } from './infrastructure';

const commandHandlers = [
  ActivateUserHandler,
  DeactivateUserHandler,
  SuspendUserHandler,
  UpdateUserProfileHandler,
];

const queryHandlers = [GetUserByIdHandler, GetUsersPageHandler];

@Module({
  providers: [
    PrismaUserRepository,
    {
      provide: USER_REPOSITORY,
      useExisting: PrismaUserRepository,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [...commandHandlers, ...queryHandlers],
})
export class UsersModule {}
