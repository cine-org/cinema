import { Module } from '@nestjs/common';
import { AuthModule as AuthDomainModule } from '@repo/auth';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [AuthDomainModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
