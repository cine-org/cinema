export const STATUS_VALUES = ['active', 'suspended', 'banned'] as const;
export type UserStatus = (typeof STATUS_VALUES)[number];

// the fields every user list works with; customers and employees add their own
export type User = {
  id: string;
  fullName: string | null;
  email: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  status: UserStatus;
  deletedAt: string | null;
};
