// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class PasswordHasher {
  abstract hash(password: string): Promise<string>;
  // A null hash (no such account) still costs a full verification and returns false, so response
  // time does not reveal whether the email has an account.
  abstract verify(passwordHash: string | null, password: string): Promise<boolean>;
}
