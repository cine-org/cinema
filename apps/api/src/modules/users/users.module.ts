import { Module } from '@nestjs/common';
import { UsersModule as UsersDomainModule } from '@repo/users';
import { AdminUsersController } from './admin-users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [UsersDomainModule],
  controllers: [AdminUsersController],
  providers: [UsersService],
})
export class UsersModule {}
