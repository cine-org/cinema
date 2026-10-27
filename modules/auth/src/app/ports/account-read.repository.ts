// What the admin app shows of the signed-in account.
export type AccountProfile = {
  readonly email: string | null;
  readonly fullName: string | null;
  // Display name of the active role; null without one.
  readonly roleName: string | null;
};

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class AccountReadRepository {
  abstract existsByEmail(email: string): Promise<boolean>;
  // Null if the account is gone.
  abstract findProfile(accountId: string): Promise<AccountProfile | null>;
}
