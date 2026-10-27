// An invitation waits days, not minutes: the invitee may not read the email at once. The code is
// still six digits with a few attempts, like the other email codes.
export const ACCOUNT_INVITATION_POLICY = {
  otpTtlSeconds: 3 * 24 * 3600,
  maxFailedAttempts: 5,
} as const;
