import { Module } from '@nestjs/common';
import { UsersModule as UsersDomainModule } from '@repo/users';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [UsersDomainModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
