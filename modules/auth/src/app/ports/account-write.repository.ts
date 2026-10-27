import type { Email } from '@repo/common';
import type { RoleScope } from '@repo/iam';
import type { Account } from '../../domain';

export type RegistrationAccount = {
  readonly id: string;
  readonly isEmailVerified: boolean;
  readonly deletedAt: Date | null;
};

// The active role decides which side the account signs in on.
// The active role and the scope it was granted at.
export type AccountRole = {
  readonly key: string;
  readonly scope: RoleScope;
};

// The active role with what it allows now: what admin routes check.
export type AccountGrant = AccountRole & {
  // Set for a CLUSTER grant.
  readonly clusterId: string | null;
  // Set for a THEATER grant.
  readonly theaterId: string | null;
  // As stored: an admin's edits apply on the next request.
  readonly permissions: readonly string[];
};

export type LoginCredentials = {
  readonly id: string;
  readonly passwordHash: string;
  readonly isEmailVerified: boolean;
  readonly role: AccountRole | null;
};

// What change-password checks the current password against.
export type PasswordCheck = {
  readonly email: Email;
  readonly passwordHash: string;
};

export type VerificationOwner = {
  readonly accountId: string;
  readonly email: Email;
  // Unlocked read: account unverified and this is its latest code. modify() still decides.
  readonly canResend: boolean;
};

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class AccountWriteRepository {
  // Early registration check; modify() checks the account again under its row lock.
  abstract findRegistrationByEmail(email: Email): Promise<RegistrationAccount | null>;
  // Reads the primary, so an account verified a moment ago can log in. Null if deleted.
  abstract findLoginCredentials(email: Email): Promise<LoginCredentials | null>;
  // Account of a password reset code, unless deleted.
  abstract findOwnerOfPasswordReset(resetId: string): Promise<{ accountId: string } | null>;
  // Null if the account is deleted.
  abstract findPasswordCheck(accountId: string): Promise<PasswordCheck | null>;
  abstract findOwnerOfVerification(verificationId: string): Promise<VerificationOwner | null>;
  // Saves a new account with its first code.
  abstract create(account: Account): Promise<void>;
  // Locks the account, applies `change` and saves it in one transaction, ending its sessions if
  // the change asks to. Null if the account is gone. `change` must not throw for business
  // outcomes, or the save is rolled back.
  abstract modify<T>(accountId: string, change: (account: Account) => T): Promise<T | null>;
}
