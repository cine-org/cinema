import {
  AUTH_ERROR_CODE,
  USER_ERROR_CODE,
  type AuthErrorCode,
  type UserErrorCode,
} from '@repo/contracts';
import { AppException, type AppExceptionOptions } from '@repo/shared';

export class AuthException extends AppException {
  constructor(
    readonly code: AuthErrorCode,
    message: string,
    options: AppExceptionOptions = {},
  ) {
    super(message, options);
  }
}

export class RegistrationConflictException extends AppException {
  constructor(
    readonly code: UserErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export const AuthError = {
  invalid: (message = 'Invalid authentication request') =>
    new AuthException(AUTH_ERROR_CODE.INVALID, message),
  invalidCredentials: () =>
    new AuthException(AUTH_ERROR_CODE.INVALID_CREDENTIALS, 'Invalid credentials'),
  invalidToken: () => new AuthException(AUTH_ERROR_CODE.INVALID_TOKEN, 'Invalid or expired token'),
  emailNotVerified: () =>
    new AuthException(AUTH_ERROR_CODE.EMAIL_NOT_VERIFIED, 'Email is not verified'),
  accountInactive: () =>
    new AuthException(AUTH_ERROR_CODE.ACCOUNT_INACTIVE, 'Account is not active'),
  sessionNotFound: () => new AuthException(AUTH_ERROR_CODE.SESSION_NOT_FOUND, 'Session not found'),
  sessionRevoked: () => new AuthException(AUTH_ERROR_CODE.SESSION_REVOKED, 'Session is revoked'),
  refreshReused: () =>
    new AuthException(AUTH_ERROR_CODE.REFRESH_TOKEN_REUSED, 'Refresh token reuse detected'),
  challengeInvalid: () =>
    new AuthException(AUTH_ERROR_CODE.CHALLENGE_INVALID, 'Challenge is invalid'),
  challengeExpired: () =>
    new AuthException(AUTH_ERROR_CODE.CHALLENGE_EXPIRED, 'Challenge is expired'),
};

export const RegistrationConflict = {
  email: () =>
    new RegistrationConflictException(
      USER_ERROR_CODE.EMAIL_ALREADY_EXISTS,
      'Email is already registered',
    ),
  username: () =>
    new RegistrationConflictException(
      USER_ERROR_CODE.USERNAME_ALREADY_EXISTS,
      'Username is already registered',
    ),
};
