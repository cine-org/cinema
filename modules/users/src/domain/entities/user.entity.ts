import { UserStatus } from '../value-objects';

export type UserProps = {
  readonly id: string;
  readonly fullName?: string | null;
  readonly avatarUrl?: string | null;
  readonly dateOfBirth?: Date | null;
  readonly status: UserStatus;
  readonly statusChangedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type UpdateUserProfileInput = {
  readonly fullName?: string | null;
  readonly avatarUrl?: string | null;
  readonly dateOfBirth?: Date | null;
  readonly updatedAt: Date;
};

export class User {
  private constructor(private readonly props: UserProps) {}

  static restore(props: UserProps): User {
    return new User(props);
  }

  updateProfile(input: UpdateUserProfileInput): User {
    return new User({
      ...this.props,
      fullName: input.fullName ?? null,
      avatarUrl: input.avatarUrl ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
      updatedAt: input.updatedAt,
    });
  }

  isPendingVerification(): boolean {
    return this.props.status.isPendingVerification();
  }

  isActive(): boolean {
    return this.props.status.isActive();
  }

  isDeactivated(): boolean {
    return this.props.status.isDeactivated();
  }

  isSuspended(): boolean {
    return this.props.status.isSuspended();
  }

  get id(): string {
    return this.props.id;
  }

  get fullName(): string | null | undefined {
    return this.props.fullName;
  }

  get avatarUrl(): string | null | undefined {
    return this.props.avatarUrl;
  }

  get dateOfBirth(): Date | null | undefined {
    return this.props.dateOfBirth;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get statusChangedAt(): Date {
    return this.props.statusChangedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
