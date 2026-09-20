import { UserStatus } from '../value-objects';
import { UserInvalidStatusTransitionException } from '../exceptions';

export type UserProps = {
  readonly id: string;
  readonly username: string;
  readonly normalizedUsername: string;
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
      fullName: input.fullName === undefined ? this.props.fullName : input.fullName,
      avatarUrl: input.avatarUrl === undefined ? this.props.avatarUrl : input.avatarUrl,
      dateOfBirth: input.dateOfBirth === undefined ? this.props.dateOfBirth : input.dateOfBirth,
      updatedAt: input.updatedAt,
    });
  }

  activate(changedAt: Date): User {
    if (this.isActive()) return this;
    if (this.isPendingVerification()) {
      throw new UserInvalidStatusTransitionException({
        message: 'Pending users must verify their email before activation',
      });
    }
    return this.withStatus(UserStatus.active(), changedAt);
  }

  deactivate(changedAt: Date): User {
    if (this.isDeactivated()) return this;
    if (this.isPendingVerification()) {
      throw new UserInvalidStatusTransitionException({
        message: 'Pending users cannot be deactivated',
      });
    }
    return this.withStatus(UserStatus.deactivated(), changedAt);
  }

  suspend(changedAt: Date): User {
    if (this.isSuspended()) return this;
    if (!this.isActive()) {
      throw new UserInvalidStatusTransitionException({
        message: 'Only active users can be suspended',
      });
    }
    return this.withStatus(UserStatus.suspended(), changedAt);
  }

  private withStatus(status: UserStatus, changedAt: Date): User {
    return new User({ ...this.props, status, statusChangedAt: changedAt, updatedAt: changedAt });
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

  get username(): string {
    return this.props.username;
  }

  get normalizedUsername(): string {
    return this.props.normalizedUsername;
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
