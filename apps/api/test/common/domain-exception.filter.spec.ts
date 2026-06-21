import { HttpStatus, type ArgumentsHost } from '@nestjs/common';
import { COMMON_ERROR_CODE, USER_ERROR_CODE, type AppErrorCode } from '@repo/contracts';
import { AppException } from '@repo/shared';
import { getHttpStatusForErrorCode } from '@/common/errors';
import { GlobalExceptionFilter } from '@/common/filters';
import type { ErrorResponse } from '@/common/responses';
import type { Response } from 'express';

class UserNotFoundException extends AppException {
  readonly code = USER_ERROR_CODE.NOT_FOUND;

  constructor() {
    super('User not found', {
      details: [{ field: 'userId', message: 'User not found' }],
    });
  }
}

describe('getHttpStatusForErrorCode', () => {
  it('maps a domain error code to its HTTP status', () => {
    expect(getHttpStatusForErrorCode(USER_ERROR_CODE.NOT_FOUND)).toBe(HttpStatus.NOT_FOUND);
  });

  it('falls back for an unknown runtime code', () => {
    expect(getHttpStatusForErrorCode('UNKNOWN.CODE' as AppErrorCode)).toBe(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });
});

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  function createHttpContext() {
    const response = {
      getHeader: jest.fn().mockReturnValue('request-27'),
      json: jest.fn(),
      status: jest.fn(),
    } as unknown as Response;
    jest.mocked(response.status).mockReturnValue(response);

    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as ArgumentsHost;

    return { host, response };
  }

  function getResponseBody(response: Response) {
    return jest.mocked(response.json).mock.calls[0]?.[0] as ErrorResponse;
  }

  it('translates domain exceptions into the stable response envelope', () => {
    const { host, response } = createHttpContext();

    filter.catch(new UserNotFoundException(), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(getResponseBody(response)).toMatchObject({
      success: false,
      message: 'User not found',
      code: USER_ERROR_CODE.NOT_FOUND,
      errors: [{ field: 'userId', message: 'User not found' }],
      requestId: 'request-27',
    });
  });

  it('hides and logs unknown exceptions', () => {
    const { host, response } = createHttpContext();
    const exception = new Error('sensitive failure');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      filter.catch(exception, host);
      expect(consoleError).toHaveBeenCalledWith(exception);
    } finally {
      consoleError.mockRestore();
    }

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(getResponseBody(response)).toMatchObject({
      message: 'Internal server error',
      code: COMMON_ERROR_CODE.INTERNAL,
    });
  });
});
