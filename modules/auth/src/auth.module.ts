import { Module } from '@nestjs/common';
import {
  AccountReadRepository,
  AccountWriteRepository,
  PasswordHasher,
  RegisterHandler,
} from './app';
import {
  Argon2PasswordHasher,
  PrismaAccountReadRepository,
  PrismaAccountWriteRepository,
} from './infra';

const commandHandlers = [RegisterHandler];

@Module({
  providers: [
    { provide: AccountReadRepository, useClass: PrismaAccountReadRepository },
    { provide: AccountWriteRepository, useClass: PrismaAccountWriteRepository },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    ...commandHandlers,
  ],
  exports: [...commandHandlers],
})
export class AuthModule {}
