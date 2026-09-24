import { hash } from '@node-rs/argon2';
import { Injectable } from '@nestjs/common';
import type { PasswordHasher } from '../../app';

// OWASP baseline for Argon2id, which is the library default: 19 MiB memory, 2 passes, 1 lane.
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return hash(password, ARGON2_OPTIONS);
  }
}
