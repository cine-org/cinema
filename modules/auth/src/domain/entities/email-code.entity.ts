import { EMAIL_VERIFICATION_POLICY, PASSWORD_RESET_POLICY } from '../policies';

export const EMAIL_CODE_PURPOSE = {
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const;

export type EmailCodePurpose = (typeof EMAIL_CODE_PURPOSE)[keyof typeof EMAIL_CODE_PURPOSE];

const POLICIES = {
  EMAIL_VERIFICATION: EMAIL_VERIFICATION_POLICY,
  PASSWORD_RESET: PASSWORD_RESET_POLICY,
} as const satisfies Record<EmailCodePurpose, { otpTtlSeconds: number; maxFailedAttempts: number }>;

export function emailCodePolicy(purpose: EmailCodePurpose) {
  return POLICIES[purpose];
}

export type EmailCodeProps = {
  readonly id: string;
  readonly accountId: string;
  readonly purpose: EmailCodePurpose;
  // HMAC of the OTP; the OTP itself is never stored.
  readonly secretDigest: string;
  failedAttempts: number;
  readonly expiresAt: Date;
  consumedAt: Date | null;
  revokedAt: Date | null;
  readonly createdAt: Date;
};

// One OTP sent to the account's email, to verify the email or to reset the password. Only
// Account changes it.
export class EmailCode {
  private constructor(private readonly props: EmailCodeProps) {}

  static issue(input: {
    id: string;
    accountId: string;
    purpose: EmailCodePurpose;
    secretDigest: string;
    now: Date;
  }): EmailCode {
    const { otpTtlSeconds } = emailCodePolicy(input.purpose);
    return new EmailCode({
      ...input,
      failedAttempts: 0,
      expiresAt: new Date(input.now.getTime() + otpTtlSeconds * 1000),
      consumedAt: null,
      revokedAt: null,
      createdAt: input.now,
    });
  }

  static restore(props: EmailCodeProps): EmailCode {
    return new EmailCode({ ...props });
  }

  // Not used and not revoked yet; may still be expired.
  get isActive(): boolean {
    return this.props.consumedAt === null && this.props.revokedAt === null;
  }

  get isConsumed(): boolean {
    return this.props.consumedAt !== null;
  }

  get hasNoAttemptsLeft(): boolean {
    return this.props.failedAttempts >= emailCodePolicy(this.props.purpose).maxFailedAttempts;
  }

  canBeChecked(now: Date): boolean {
    return this.isActive && !this.hasNoAttemptsLeft && now < this.props.expiresAt;
  }

  // The last allowed failure also revokes the code.
  recordFailure(now: Date): void {
    this.props.failedAttempts += 1;
    if (this.hasNoAttemptsLeft) this.props.revokedAt = now;
  }

  consume(now: Date): void {
    this.props.consumedAt = now;
  }

  revoke(now: Date): void {
    if (this.isActive) this.props.revokedAt = now;
  }

  get id(): string {
    return this.props.id;
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get purpose(): EmailCodePurpose {
    return this.props.purpose;
  }

  get secretDigest(): string {
    return this.props.secretDigest;
  }

  get failedAttempts(): number {
    return this.props.failedAttempts;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get consumedAt(): Date | null {
    return this.props.consumedAt;
  }

  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
