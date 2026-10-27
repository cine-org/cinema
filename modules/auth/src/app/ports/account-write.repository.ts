import type { Email } from '@repo/common';
import type { GrantPlace, RoleScope } from '@repo/iam';
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

// The role a new account starts with: CUSTOMER on registration, an internal role on invitation.
export type NewAccountRole = GrantPlace & {
  readonly roleKey: string;
  // Null for the system (registration, the first admin).
  readonly grantedById: string | null;
};

// An existing account with the email being invited, and its active role.
export type InvitationTarget = {
  readonly id: string;
  readonly isEmailVerified: boolean;
  readonly deletedAt: Date | null;
  readonly role: (GrantPlace & { readonly key: string }) | null;
};

export type RoleSummary = {
  readonly key: string;
  readonly scopes: readonly RoleScope[];
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
  // Saves a new account with its first code and its role.
  abstract create(account: Account, role: NewAccountRole): Promise<void>;
  abstract findInvitationTarget(email: Email): Promise<InvitationTarget | null>;
  // Account of an invitation code, unless deleted.
  abstract findOwnerOfInvitation(invitationId: string): Promise<{ accountId: string } | null>;
  abstract findRole(key: string): Promise<RoleSummary | null>;
  // Whether a theater exists and is not closed, so staff can be invited to it.
  abstract isOpenTheater(theaterId: string): Promise<boolean>;
  abstract clusterExists(clusterId: string): Promise<boolean>;
  // Creates a verified SUPER_ADMIN, unless an active one exists. Serialized against itself.
  abstract createFirstAdmin(account: Account): Promise<'CREATED' | 'ADMIN_EXISTS'>;
  // Locks the account, applies `change` and saves it in one transaction, ending its sessions if
  // the change asks to. Null if the account is gone. `change` must not throw for business
  // outcomes, or the save is rolled back.
  abstract modify<T>(accountId: string, change: (account: Account) => T): Promise<T | null>;
}
