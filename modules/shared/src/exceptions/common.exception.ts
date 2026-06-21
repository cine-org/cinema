import { COMMON_ERROR_CODE, type ErrorDetail } from '@repo/contracts';
import { AppException, type AppExceptionOptions } from './app.exception';

export type CommonExceptionOptions = AppExceptionOptions & {
  readonly message?: string;
};

export type ValidationExceptionOptions = CommonExceptionOptions & {
  readonly details: ErrorDetail[];
};

export class BadRequestException extends AppException {
  readonly code = COMMON_ERROR_CODE.BAD_REQUEST;

  constructor({ message = 'Bad request', ...options }: CommonExceptionOptions = {}) {
    super(message, options);
  }
}

export class ValidationException extends AppException {
  readonly code = COMMON_ERROR_CODE.VALIDATION;

  constructor({ message = 'Validation failed', ...options }: ValidationExceptionOptions) {
    super(message, options);
  }
}

export class UnauthorizedException extends AppException {
  readonly code = COMMON_ERROR_CODE.UNAUTHORIZED;

  constructor({ message = 'Unauthorized', ...options }: CommonExceptionOptions = {}) {
    super(message, options);
  }
}

export class ForbiddenException extends AppException {
  readonly code = COMMON_ERROR_CODE.FORBIDDEN;

  constructor({ message = 'Forbidden', ...options }: CommonExceptionOptions = {}) {
    super(message, options);
  }
}

export class ResourceNotFoundException extends AppException {
  readonly code = COMMON_ERROR_CODE.NOT_FOUND;

  constructor({ message = 'Resource not found', ...options }: CommonExceptionOptions = {}) {
    super(message, options);
  }
}

export class ConflictException extends AppException {
  readonly code = COMMON_ERROR_CODE.CONFLICT;

  constructor({ message = 'Conflict', ...options }: CommonExceptionOptions = {}) {
    super(message, options);
  }
}

export class UnprocessableEntityException extends AppException {
  readonly code = COMMON_ERROR_CODE.UNPROCESSABLE_ENTITY;

  constructor({ message = 'Unprocessable entity', ...options }: CommonExceptionOptions = {}) {
    super(message, options);
  }
}

export class TooManyRequestsException extends AppException {
  readonly code = COMMON_ERROR_CODE.TOO_MANY_REQUESTS;

  constructor({ message = 'Too many requests', ...options }: CommonExceptionOptions = {}) {
    super(message, options);
  }
}

export class TimeoutException extends AppException {
  readonly code = COMMON_ERROR_CODE.TIMEOUT;

  constructor({ message = 'Request timeout', ...options }: CommonExceptionOptions = {}) {
    super(message, options);
  }
}

export class InternalException extends AppException {
  readonly code = COMMON_ERROR_CODE.INTERNAL;

  constructor({ message = 'Internal server error', ...options }: CommonExceptionOptions = {}) {
    super(message, options);
  }
}

export class NotImplementedException extends AppException {
  readonly code = COMMON_ERROR_CODE.NOT_IMPLEMENTED;

  constructor({ message = 'Not implemented', ...options }: CommonExceptionOptions = {}) {
    super(message, options);
  }
}

export class ServiceUnavailableException extends AppException {
  readonly code = COMMON_ERROR_CODE.SERVICE_UNAVAILABLE;

  constructor({ message = 'Service unavailable', ...options }: CommonExceptionOptions = {}) {
    super(message, options);
  }
}

export class GatewayTimeoutException extends AppException {
  readonly code = COMMON_ERROR_CODE.GATEWAY_TIMEOUT;

  constructor({ message = 'Gateway timeout', ...options }: CommonExceptionOptions = {}) {
    super(message, options);
  }
}

export const CommonException = {
  badRequest: (options?: CommonExceptionOptions) => new BadRequestException(options),
  validation: (options: ValidationExceptionOptions) => new ValidationException(options),
  unauthorized: (options?: CommonExceptionOptions) => new UnauthorizedException(options),
  forbidden: (options?: CommonExceptionOptions) => new ForbiddenException(options),
  notFound: (options?: CommonExceptionOptions) => new ResourceNotFoundException(options),
  conflict: (options?: CommonExceptionOptions) => new ConflictException(options),
  unprocessableEntity: (options?: CommonExceptionOptions) =>
    new UnprocessableEntityException(options),
  tooManyRequests: (options?: CommonExceptionOptions) => new TooManyRequestsException(options),
  timeout: (options?: CommonExceptionOptions) => new TimeoutException(options),
  internal: (options?: CommonExceptionOptions) => new InternalException(options),
  notImplemented: (options?: CommonExceptionOptions) => new NotImplementedException(options),
  serviceUnavailable: (options?: CommonExceptionOptions) =>
    new ServiceUnavailableException(options),
  gatewayTimeout: (options?: CommonExceptionOptions) => new GatewayTimeoutException(options),
} as const satisfies Record<string, (...args: never[]) => AppException>;

export type CommonExceptionCode = (typeof COMMON_ERROR_CODE)[keyof typeof COMMON_ERROR_CODE];
