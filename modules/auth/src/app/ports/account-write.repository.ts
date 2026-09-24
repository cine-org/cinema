import type { Account } from '../../domain';

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class AccountWriteRepository {
  abstract save(account: Account): Promise<void>;
}
