import { AppException, type AppExceptionOptions } from '@repo/common';
import type { AuthSessionRevokedReason } from '../entities';

export const AUTH_ERROR_CODE = {
  EMAIL_ALREADY_EXISTS: 'AUTH.EMAIL_ALREADY_EXISTS',
  EMAIL_NOT_VERIFIED: 'AUTH.EMAIL_NOT_VERIFIED',
  INVALID_CREDENTIALS: 'AUTH.INVALID_CREDENTIALS',
  INVALID_CURRENT_PASSWORD: 'AUTH.INVALID_CURRENT_PASSWORD',
  INVALID_ACCESS_TOKEN: 'AUTH.INVALID_ACCESS_TOKEN',
  INVALID_REFRESH_TOKEN: 'AUTH.INVALID_REFRESH_TOKEN',
  REFRESH_TOKEN_REUSED: 'AUTH.REFRESH_TOKEN_REUSED',
  SESSION_ENDED: 'AUTH.SESSION_ENDED',
  SESSION_NOT_FOUND: 'AUTH.SESSION_NOT_FOUND',
  INVALID_EMAIL_OTP: 'AUTH.INVALID_EMAIL_OTP',
  OTP_ATTEMPTS_EXCEEDED: 'AUTH.OTP_ATTEMPTS_EXCEEDED',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODE)[keyof typeof AUTH_ERROR_CODE];

export class EmailAlreadyExistsException extends AppException {
  readonly code = AUTH_ERROR_CODE.EMAIL_ALREADY_EXISTS;

  constructor({ message = 'Email already exists', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// One error for every unusable code, for email verification and password reset alike: unknown
// id, wrong OTP, expired, revoked, already used, or replaced by a newer code. Telling them apart
// would leak account state.
export class InvalidEmailOtpException extends AppException {
  readonly code = AUTH_ERROR_CODE.INVALID_EMAIL_OTP;

  constructor({
    message = 'Verification code is invalid or expired',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// The code took its last allowed wrong OTP and was revoked; the user needs a new one.
export class OtpAttemptsExceededException extends AppException {
  readonly code = AUTH_ERROR_CODE.OTP_ATTEMPTS_EXCEEDED;

  constructor({
    message = 'Too many wrong codes; request a new verification code',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// One error for an unknown email, a deleted account and a wrong password, so login does not reveal
// which emails have an account.
export class InvalidCredentialsException extends AppException {
  readonly code = AUTH_ERROR_CODE.INVALID_CREDENTIALS;

  constructor({
    message = 'Email or password is incorrect',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// Raised only after the password matched, so it reveals nothing to someone without it. Registering
// again sends a new code.
export class EmailNotVerifiedException extends AppException {
  readonly code = AUTH_ERROR_CODE.EMAIL_NOT_VERIFIED;

  constructor({ message = 'Email is not verified', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// Bad signature, wrong issuer or audience, expired, or its account is gone.
export class InvalidAccessTokenException extends AppException {
  readonly code = AUTH_ERROR_CODE.INVALID_ACCESS_TOKEN;

  constructor({
    message = 'Access token is invalid or expired',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// Missing, malformed or unknown refresh token, or its account is gone.
export class InvalidRefreshTokenException extends AppException {
  readonly code = AUTH_ERROR_CODE.INVALID_REFRESH_TOKEN;

  constructor({ message = 'Refresh token is invalid', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// A concurrent refresh (another tab) consumed the token moments ago. Not an attack: the cookie
// already holds the new token, so the client retries the refresh.
export class RefreshTokenReusedException extends AppException {
  readonly code = AUTH_ERROR_CODE.REFRESH_TOKEN_REUSED;

  constructor({
    message = 'Refresh token was just used by another request; retry',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

const SESSION_ENDED_MESSAGES: Record<AuthSessionRevokedReason | 'EXPIRED', string> = {
  LOGOUT: 'Session was logged out',
  LOGOUT_ALL: 'Session was logged out from all devices',
  SESSION_DELETED: 'Session was revoked',
  SESSION_LIMIT: 'Session was ended by a login on another device',
  REPLAY: 'Session was ended because a used refresh token was presented again',
  PASSWORD_RESET: 'Session was ended because the password was reset',
  PASSWORD_CHANGED: 'Session was ended because the password was changed',
  EXPIRED: 'Session expired',
};

// The session was revoked or expired. The reason is the detail's code, so the client can tell
// "logged in elsewhere" from "suspicious activity"; it is the caller's own session, so it leaks
// nothing.
export class SessionEndedException extends AppException {
  readonly code = AUTH_ERROR_CODE.SESSION_ENDED;

  constructor(reason: AuthSessionRevokedReason | null, options: AppExceptionOptions = {}) {
    const detailCode = reason ?? 'EXPIRED';
    super(options.message ?? 'Session has ended; log in again', {
      ...options,
      details: [{ code: detailCode, message: SESSION_ENDED_MESSAGES[detailCode] }],
    });
  }
}

// Unknown, already revoked or someone else's: telling them apart would leak other accounts' ids.
export class SessionNotFoundException extends AppException {
  readonly code = AUTH_ERROR_CODE.SESSION_NOT_FOUND;

  constructor({ message = 'Session not found', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// Change password with a wrong current password. Counted against the email's login attempts.
export class InvalidCurrentPasswordException extends AppException {
  readonly code = AUTH_ERROR_CODE.INVALID_CURRENT_PASSWORD;

  constructor({ message = 'Current password is incorrect', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}
