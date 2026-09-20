import { UserInvalidException } from '../exceptions';

export const USER_STATUS = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  ACTIVE: 'ACTIVE',
  DEACTIVATED: 'DEACTIVATED',
  SUSPENDED: 'SUSPENDED',
} as const;

export type UserStatusValue = (typeof USER_STATUS)[keyof typeof USER_STATUS];

const USER_STATUS_VALUES = Object.values(USER_STATUS) as readonly string[];

export class UserStatus {
  private constructor(private readonly status: UserStatusValue) {}

  static pendingVerification(): UserStatus {
    return new UserStatus(USER_STATUS.PENDING_VERIFICATION);
  }

  static active(): UserStatus {
    return new UserStatus(USER_STATUS.ACTIVE);
  }

  static deactivated(): UserStatus {
    return new UserStatus(USER_STATUS.DEACTIVATED);
  }

  static suspended(): UserStatus {
    return new UserStatus(USER_STATUS.SUSPENDED);
  }

  static create(value: string): UserStatus {
    if (!USER_STATUS_VALUES.includes(value)) {
      throw new UserInvalidException({ message: 'Invalid user status' });
    }

    return new UserStatus(value as UserStatusValue);
  }

  get value(): UserStatusValue {
    return this.status;
  }

  isPendingVerification(): boolean {
    return this.status === USER_STATUS.PENDING_VERIFICATION;
  }

  isActive(): boolean {
    return this.status === USER_STATUS.ACTIVE;
  }

  isDeactivated(): boolean {
    return this.status === USER_STATUS.DEACTIVATED;
  }

  isSuspended(): boolean {
    return this.status === USER_STATUS.SUSPENDED;
  }

  equals(other: UserStatus): boolean {
    return this.status === other.status;
  }
}
