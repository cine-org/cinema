import type { AccessGrant } from '../../domain';

export abstract class AccessGrantRepository {
  // The account's active role with its live permissions; null when it holds none or is deleted.
  abstract findActive(accountId: string): Promise<AccessGrant | null>;
}
