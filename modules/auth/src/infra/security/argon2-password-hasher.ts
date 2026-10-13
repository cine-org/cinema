import { randomBytes } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
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
  // Hash of a random password with the same options, verified when there is no account.
  private decoyHash: Promise<string> | null = null;

  async hash(password: string): Promise<string> {
    return hash(password, ARGON2_OPTIONS);
  }

  async verify(passwordHash: string | null, password: string): Promise<boolean> {
    if (passwordHash === null) {
      await verify(await this.decoy(), password);
      return false;
    }
    return verify(passwordHash, password);
  }

  private decoy(): Promise<string> {
    this.decoyHash ??= hash(randomBytes(32).toString('base64'), ARGON2_OPTIONS);
    return this.decoyHash;
  }
}
