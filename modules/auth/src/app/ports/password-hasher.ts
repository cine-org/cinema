// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class PasswordHasher {
  abstract hash(password: string): Promise<string>;
}
