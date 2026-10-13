import { TooManyRequestsException, type Email } from '@repo/common';
import { EMAIL_VERIFICATION_POLICY } from '../../domain';
import type { EmailVerificationLimiter } from '../ports';

// OTP issuance details returned by accepted register/resend requests.
export type VerificationAccepted = {
  readonly verificationId: string;
  readonly expiresInSeconds: number;
  readonly resendAfterSeconds: number;
};

export function verificationAccepted(verificationId: string): VerificationAccepted {
  return {
    verificationId,
    expiresInSeconds: EMAIL_VERIFICATION_POLICY.otpTtlSeconds,
    resendAfterSeconds: EMAIL_VERIFICATION_POLICY.cooldown.refillIntervalMs / 1000,
  };
}

// Same shape as a real id, pointing nowhere.
export function decoyVerification(): VerificationAccepted {
  return verificationAccepted(crypto.randomUUID());
}

export async function takeIssuanceOrThrow(
  limiter: EmailVerificationLimiter,
  email: Email,
): Promise<void> {
  const limit = await limiter.takeIssuance(email);
  if (!limit.allowed) {
    throw new TooManyRequestsException({
      message: 'Please wait before requesting another code',
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }
}
