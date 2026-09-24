import { Injectable } from '@nestjs/common';
import {
  RegisterCommand,
  RegisterHandler,
  type RegisterCommandProps,
  type RegisterResult,
} from '@repo/auth';

// One entry point for the module's handlers; controllers never touch a handler directly.
@Injectable()
export class AuthService {
  constructor(private readonly registerHandler: RegisterHandler) {}

  async register(props: RegisterCommandProps): Promise<RegisterResult> {
    return this.registerHandler.execute(new RegisterCommand(props));
  }
}
