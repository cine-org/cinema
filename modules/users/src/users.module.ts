import { Module } from '@nestjs/common';
import { GetUserByIdHandler, UserReadRepository } from './app';
import { PrismaUserReadRepository } from './infra';

const queryHandlers = [GetUserByIdHandler];

@Module({
  providers: [
    { provide: UserReadRepository, useClass: PrismaUserReadRepository },
    ...queryHandlers,
  ],
  exports: [...queryHandlers],
})
export class UsersModule {}
