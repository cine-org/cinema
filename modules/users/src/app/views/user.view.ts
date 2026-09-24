export type UserView = {
  readonly id: string;
  readonly email: string | null;
  readonly isEmailVerified: boolean;
  readonly fullName: string | null;
  readonly dateOfBirth: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
