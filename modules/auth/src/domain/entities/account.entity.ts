import type { Email } from '@repo/common';
import { EMAIL_CODE_PURPOSE, type EmailCode, type EmailCodePurpose } from './email-code.entity';

export type AccountProps = {
  readonly id: string;
  readonly email: Email;
  passwordHash: string;
  fullName: string | null;
  isEmailVerified: boolean;
};

// The latest code of each purpose. Older codes are never active, so they are not loaded.
export type AccountCodes = {
  readonly verification: EmailCode | null;
  readonly passwordReset: EmailCode | null;
};

export type RegisterAccountInput = {
  readonly id: string;
  readonly email: Email;
  readonly passwordHash: string;
  readonly fullName?: string | null;
  readonly verification: EmailCode;
};

// Every session of the account must end, in the same transaction as the change that asks for it.
export type SessionRevocation = {
  readonly reason: 'PASSWORD_RESET' | 'PASSWORD_CHANGED';
  readonly at: Date;
};

export type VerifyEmailResult = 'VERIFIED' | 'ALREADY_VERIFIED' | 'INVALID' | 'TOO_MANY_ATTEMPTS';
export type ResetPasswordResult = 'RESET' | 'INVALID' | 'TOO_MANY_ATTEMPTS';

type CodeSlot = 'verification' | 'passwordReset';

const SLOT_PURPOSE: Record<CodeSlot, EmailCodePurpose> = {
  verification: EMAIL_CODE_PURPOSE.EMAIL_VERIFICATION,
  passwordReset: EMAIL_CODE_PURPOSE.PASSWORD_RESET,
};

// An account with the latest code of each purpose. Methods return results instead of throwing,
// so a wrong OTP can still be saved.
export class Account {
  private readonly codes: Record<CodeSlot, EmailCode | null>;
  // Codes revoked because a new one replaced them; the repository saves them too.
  private readonly replaced: EmailCode[] = [];
  private revocation: SessionRevocation | null = null;

  private constructor(
    private readonly props: AccountProps,
    codes: AccountCodes,
  ) {
    this.codes = { ...codes };
  }

  // The id is generated first because the first code's digest needs it.
  static newId(): string {
    return crypto.randomUUID();
  }

  static register(input: RegisterAccountInput): Account {
    const account = new Account(
      {
        id: input.id,
        email: input.email,
        passwordHash: input.passwordHash,
        fullName: normalizeFullName(input.fullName),
        isEmailVerified: false,
      },
      { verification: null, passwordReset: null },
    );
    account.attach('verification', input.verification);
    return account;
  }

  static restore(props: AccountProps, codes: AccountCodes): Account {
    return new Account({ ...props }, codes);
  }

  // Registering again with the same email. Until the email is verified, the password and name
  // belong to whoever registered last, and only their new code can verify the account.
  reRegister(
    input: { passwordHash: string; fullName?: string | null },
    verification: EmailCode,
    now: Date,
  ): boolean {
    if (this.props.isEmailVerified) return false;

    this.props.passwordHash = input.passwordHash;
    this.props.fullName = normalizeFullName(input.fullName);
    this.replaceCode('verification', verification, now);
    return true;
  }

  // `matches` compares the submitted OTP with a code's digest.
  verifyEmail(
    verificationId: string,
    matches: (code: EmailCode) => boolean,
    now: Date,
  ): VerifyEmailResult {
    const code = this.codes.verification;
    if (code?.id !== verificationId) return 'INVALID';

    // Retry after success, e.g. the first response was lost.
    if (code.isConsumed)
      return this.props.isEmailVerified && matches(code) ? 'ALREADY_VERIFIED' : 'INVALID';

    const checked = checkCode(code, matches, now);
    if (checked !== 'MATCHED') return checked;

    code.consume(now);
    this.props.isEmailVerified = true;
    return 'VERIFIED';
  }

  // Only from the latest code: after someone re-registers, older codes cannot get a new one.
  resendCode(fromVerificationId: string, verification: EmailCode, now: Date): boolean {
    if (this.props.isEmailVerified || this.codes.verification?.id !== fromVerificationId) {
      return false;
    }
    this.replaceCode('verification', verification, now);
    return true;
  }

  // Verified or not: entering the code proves the mailbox, see resetPassword.
  requestPasswordReset(code: EmailCode, now: Date): void {
    this.replaceCode('passwordReset', code, now);
  }

  // A correct code proves control of the mailbox, so it also verifies the email: an unverified
  // account reset by the mailbox owner is theirs. Ends every session.
  resetPassword(
    resetId: string,
    matches: (code: EmailCode) => boolean,
    passwordHash: string,
    now: Date,
  ): ResetPasswordResult {
    const code = this.codes.passwordReset;
    if (code?.id !== resetId || code.isConsumed) return 'INVALID';

    const checked = checkCode(code, matches, now);
    if (checked !== 'MATCHED') return checked;

    code.consume(now);
    this.props.passwordHash = passwordHash;
    if (!this.props.isEmailVerified) {
      this.props.isEmailVerified = true;
      this.codes.verification?.revoke(now);
    }
    this.revocation = { reason: 'PASSWORD_RESET', at: now };
    return 'RESET';
  }

  // `verifiedHash` is the hash the current password was checked against, outside the lock. False
  // if the password changed since, so the check no longer holds. Ends every session, this one too.
  changePassword(verifiedHash: string, passwordHash: string, now: Date): boolean {
    if (this.props.passwordHash !== verifiedHash) return false;

    this.props.passwordHash = passwordHash;
    // A pending reset code would undo the change.
    this.codes.passwordReset?.revoke(now);
    this.revocation = { reason: 'PASSWORD_CHANGED', at: now };
    return true;
  }

  private replaceCode(slot: CodeSlot, code: EmailCode, now: Date): void {
    const current = this.codes[slot];
    if (this.replaced.some((old) => old.purpose === code.purpose)) {
      throw new Error('Only one code change per purpose per load');
    }
    if (current?.isActive) {
      current.revoke(now);
      this.replaced.push(current);
    }
    this.attach(slot, code);
  }

  private attach(slot: CodeSlot, code: EmailCode): void {
    if (code.accountId !== this.props.id) throw new Error('Code belongs to another account');
    if (code.purpose !== SLOT_PURPOSE[slot]) throw new Error(`Not a ${slot} code`);
    if (!code.isActive || code.failedAttempts > 0) {
      throw new Error('Only a new code can be attached');
    }
    this.codes[slot] = code;
  }

  get id(): string {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get fullName(): string | null {
    return this.props.fullName;
  }

  get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }

  get latestVerification(): EmailCode | null {
    return this.codes.verification;
  }

  get latestPasswordReset(): EmailCode | null {
    return this.codes.passwordReset;
  }

  get replacedCodes(): readonly EmailCode[] {
    return this.replaced;
  }

  get sessionRevocation(): SessionRevocation | null {
    return this.revocation;
  }
}

// Shared checks before a code is consumed; a wrong OTP is recorded.
function checkCode(
  code: EmailCode,
  matches: (code: EmailCode) => boolean,
  now: Date,
): 'MATCHED' | 'INVALID' | 'TOO_MANY_ATTEMPTS' {
  if (code.hasNoAttemptsLeft) return 'TOO_MANY_ATTEMPTS';
  if (!code.canBeChecked(now)) return 'INVALID';
  if (matches(code)) return 'MATCHED';

  code.recordFailure(now);
  return code.hasNoAttemptsLeft ? 'TOO_MANY_ATTEMPTS' : 'INVALID';
}

function normalizeFullName(fullName: string | null | undefined): string | null {
  return fullName?.trim() || null;
}
