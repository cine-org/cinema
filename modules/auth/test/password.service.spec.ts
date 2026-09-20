import { describe, expect, it } from 'vitest';
import { PasswordService } from '../src/password.service';

describe('PasswordService', () => {
  it('hashes with Argon2id and verifies the password', async () => {
    const service = new PasswordService();
    const hash = await service.hash('correct horse battery staple');
    expect(hash).toContain('$argon2id$');
    await expect(service.verify(hash, 'correct horse battery staple')).resolves.toBe(true);
    await expect(service.verify(hash, 'incorrect password')).resolves.toBe(false);
  });

  it('enforces the 12-128 character contract', () => {
    const service = new PasswordService();
    expect(() => service.assertValid('too-short')).toThrow();
    expect(() => service.assertValid('x'.repeat(129))).toThrow();
    expect(() => service.assertValid('x'.repeat(12))).not.toThrow();
  });
});
