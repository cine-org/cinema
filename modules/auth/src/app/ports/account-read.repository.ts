// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class AccountReadRepository {
  abstract existsByEmail(email: string): Promise<boolean>;
}
