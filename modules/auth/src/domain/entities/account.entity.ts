export type AccountProps = {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly isEmailVerified: boolean;
  readonly fullName: string | null;
};

export type RegisterAccountInput = {
  readonly email: string;
  readonly passwordHash: string;
  readonly fullName?: string | null;
};

// The account being registered: identity plus credential, before any profile data.
export class Account {
  private constructor(private readonly props: AccountProps) {}

  static register(input: RegisterAccountInput): Account {
    return new Account({
      id: crypto.randomUUID(),
      email: Account.normalizeEmail(input.email),
      passwordHash: input.passwordHash,
      isEmailVerified: false,
      fullName: input.fullName?.trim() || null,
    });
  }

  static restore(props: AccountProps): Account {
    return new Account(props);
  }

  // Stored lowercase so the unique index also rejects case variants.
  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }

  get fullName(): string | null {
    return this.props.fullName;
  }
}
