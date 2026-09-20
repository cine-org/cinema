import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthError } from './auth.exception';

@Injectable()
export class PasswordService {
  private readonly dummyHashPromise = argon2.hash('not-a-real-password', this.options());

  async hash(password: string): Promise<string> {
    return argon2.hash(password, this.options());
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  async burn(password: string): Promise<void> {
    await this.verify(await this.dummyHashPromise, password);
  }

  assertValid(password: string): void {
    if (password.length < 12 || password.length > 128) {
      throw AuthError.invalid('Password must contain between 12 and 128 characters');
    }
  }

  private options(): argon2.Options & { type: number } {
    return { type: argon2.argon2id, memoryCost: 65_536, timeCost: 3, parallelism: 1 };
  }
}
