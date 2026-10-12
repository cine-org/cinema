import { AppException, ErrorDetail, type AppExceptionOptions } from './app.exception';

export const COMMON_ERROR_CODE = {
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION: 'VALIDATION',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL: 'INTERNAL',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
} as const;

export type CommonErrorCode = (typeof COMMON_ERROR_CODE)[keyof typeof COMMON_ERROR_CODE];

// Exceptions

export type ValidationExceptionOptions = AppExceptionOptions & {
  readonly details: ErrorDetail[];
};

export class BadRequestException extends AppException {
  readonly code = COMMON_ERROR_CODE.BAD_REQUEST;

  constructor({ message = 'Bad request', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class ValidationException extends AppException {
  readonly code = COMMON_ERROR_CODE.VALIDATION;

  constructor({ message = 'Validation failed', ...options }: ValidationExceptionOptions) {
    super(message, options);
  }
}

export class InvalidPhoneNumberException extends ValidationException {
  constructor({ message = 'Invalid phone number', ...options }: AppExceptionOptions = {}) {
    super({ message, details: [{ message, code: 'INVALID_PHONE_NUMBER' }], ...options });
  }
}

export class InvalidEmailException extends ValidationException {
  constructor({ message = 'Invalid email', ...options }: AppExceptionOptions = {}) {
    super({ message, details: [{ message, code: 'INVALID_EMAIL' }], ...options });
  }
}

export class InvalidSlugException extends ValidationException {
  constructor({ message = 'Invalid slug', ...options }: AppExceptionOptions = {}) {
    super({ message, details: [{ message, code: 'INVALID_SLUG' }], ...options });
  }
}

export class UnauthorizedException extends AppException {
  readonly code = COMMON_ERROR_CODE.UNAUTHORIZED;

  constructor({ message = 'Unauthorized', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class ForbiddenException extends AppException {
  readonly code = COMMON_ERROR_CODE.FORBIDDEN;

  constructor({ message = 'Forbidden', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class ResourceNotFoundException extends AppException {
  readonly code = COMMON_ERROR_CODE.NOT_FOUND;

  constructor({ message = 'Resource not found', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class ConflictException extends AppException {
  readonly code = COMMON_ERROR_CODE.CONFLICT;

  constructor({ message = 'Conflict', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class UnprocessableEntityException extends AppException {
  readonly code = COMMON_ERROR_CODE.UNPROCESSABLE_ENTITY;

  constructor({ message = 'Unprocessable entity', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export type RetryAfterExceptionOptions = AppExceptionOptions & {
  // Sent as the Retry-After header.
  readonly retryAfterSeconds?: number;
};

export class TooManyRequestsException extends AppException {
  readonly code = COMMON_ERROR_CODE.TOO_MANY_REQUESTS;
  readonly retryAfterSeconds?: number;

  constructor({
    message = 'Too many requests',
    retryAfterSeconds,
    ...options
  }: RetryAfterExceptionOptions = {}) {
    super(message, options);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class TimeoutException extends AppException {
  readonly code = COMMON_ERROR_CODE.TIMEOUT;

  constructor({ message = 'Request timeout', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class InternalException extends AppException {
  readonly code = COMMON_ERROR_CODE.INTERNAL;

  constructor({ message = 'Internal server error', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class NotImplementedException extends AppException {
  readonly code = COMMON_ERROR_CODE.NOT_IMPLEMENTED;

  constructor({ message = 'Not implemented', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class ServiceUnavailableException extends AppException {
  readonly code = COMMON_ERROR_CODE.SERVICE_UNAVAILABLE;
  readonly retryAfterSeconds?: number;

  constructor({
    message = 'Service unavailable',
    retryAfterSeconds,
    ...options
  }: RetryAfterExceptionOptions = {}) {
    super(message, options);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class GatewayTimeoutException extends AppException {
  readonly code = COMMON_ERROR_CODE.GATEWAY_TIMEOUT;

  constructor({ message = 'Gateway timeout', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}
