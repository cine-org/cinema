import { COMMON_ERROR_CODE, type ErrorDetail } from '@repo/contracts';
import { AppException, type AppErrorCode, type AppExceptionOptions } from './app.exception';
import { APP_EXCEPTION_STATUS } from './exception-status';

type CommonExceptionOptions = Omit<AppExceptionOptions, 'status'>;
type FixedCodeOptions = Omit<CommonExceptionOptions, 'code'>;

const create = ({
  message,
  code,
  status,
  details,
  cause,
}: {
  readonly message: string;
  readonly code: AppErrorCode;
  readonly status: AppExceptionOptions['status'];
  readonly details?: ErrorDetail[];
  readonly cause?: unknown;
}) =>
  new AppException({
    message,
    code,
    status: status ?? APP_EXCEPTION_STATUS.INTERNAL,
    details,
    cause,
  });

export const CommonException = {
  badRequest: ({
    message = 'Bad request',
    code = COMMON_ERROR_CODE.BAD_REQUEST,
    ...rest
  }: CommonExceptionOptions = {}) =>
    create({
      message,
      code,
      status: APP_EXCEPTION_STATUS.BAD_REQUEST,
      ...rest,
    }),

  validation: ({
    message = 'Validation failed',
    details,
    ...rest
  }: FixedCodeOptions & { readonly details: ErrorDetail[] }) =>
    create({
      message,
      code: COMMON_ERROR_CODE.VALIDATION,
      status: APP_EXCEPTION_STATUS.BAD_REQUEST,
      details,
      ...rest,
    }),

  unauthorized: ({ message = 'Unauthorized', ...rest }: FixedCodeOptions = {}) =>
    create({
      message,
      code: COMMON_ERROR_CODE.UNAUTHORIZED,
      status: APP_EXCEPTION_STATUS.UNAUTHORIZED,
      ...rest,
    }),

  forbidden: ({ message = 'Forbidden', ...rest }: FixedCodeOptions = {}) =>
    create({
      message,
      code: COMMON_ERROR_CODE.FORBIDDEN,
      status: APP_EXCEPTION_STATUS.FORBIDDEN,
      ...rest,
    }),

  notFound: ({
    message = 'Resource not found',
    code = COMMON_ERROR_CODE.NOT_FOUND,
    ...rest
  }: CommonExceptionOptions = {}) =>
    create({
      message,
      code,
      status: APP_EXCEPTION_STATUS.NOT_FOUND,
      ...rest,
    }),

  conflict: ({
    message = 'Conflict',
    code = COMMON_ERROR_CODE.CONFLICT,
    ...rest
  }: CommonExceptionOptions = {}) =>
    create({
      message,
      code,
      status: APP_EXCEPTION_STATUS.CONFLICT,
      ...rest,
    }),

  unprocessableEntity: ({
    message = 'Unprocessable entity',
    code = COMMON_ERROR_CODE.UNPROCESSABLE_ENTITY,
    ...rest
  }: CommonExceptionOptions = {}) =>
    create({
      message,
      code,
      status: APP_EXCEPTION_STATUS.UNPROCESSABLE_ENTITY,
      ...rest,
    }),

  tooManyRequests: ({ message = 'Too many requests', ...rest }: FixedCodeOptions = {}) =>
    create({
      message,
      code: COMMON_ERROR_CODE.TOO_MANY_REQUESTS,
      status: APP_EXCEPTION_STATUS.TOO_MANY_REQUESTS,
      ...rest,
    }),

  timeout: ({ message = 'Request timeout', ...rest }: FixedCodeOptions = {}) =>
    create({
      message,
      code: COMMON_ERROR_CODE.TIMEOUT,
      status: APP_EXCEPTION_STATUS.TIMEOUT,
      ...rest,
    }),

  internal: ({ ...rest }: Omit<FixedCodeOptions, 'message'> = {}) =>
    create({
      message: 'Internal server error',
      code: COMMON_ERROR_CODE.INTERNAL,
      status: APP_EXCEPTION_STATUS.INTERNAL,
      ...rest,
    }),

  notImplemented: ({ message = 'Not implemented', ...rest }: FixedCodeOptions = {}) =>
    create({
      message,
      code: COMMON_ERROR_CODE.NOT_IMPLEMENTED,
      status: APP_EXCEPTION_STATUS.NOT_IMPLEMENTED,
      ...rest,
    }),

  serviceUnavailable: ({ ...rest }: Omit<FixedCodeOptions, 'message'> = {}) =>
    create({
      message: 'Service unavailable',
      code: COMMON_ERROR_CODE.SERVICE_UNAVAILABLE,
      status: APP_EXCEPTION_STATUS.SERVICE_UNAVAILABLE,
      ...rest,
    }),

  gatewayTimeout: ({ ...rest }: Omit<FixedCodeOptions, 'message'> = {}) =>
    create({
      message: 'Gateway timeout',
      code: COMMON_ERROR_CODE.GATEWAY_TIMEOUT,
      status: APP_EXCEPTION_STATUS.GATEWAY_TIMEOUT,
      ...rest,
    }),
} as const satisfies Record<string, (...args: never[]) => AppException>;

export type CommonExceptionCode = string;
