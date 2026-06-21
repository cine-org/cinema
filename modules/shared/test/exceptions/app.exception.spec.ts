import { COMMON_ERROR_CODE } from '@repo/contracts';
import { describe, expect, it } from 'vitest';
import { AppException, CommonException, ValidationException } from '../../src';

class TestException extends AppException {
  readonly code = COMMON_ERROR_CODE.CONFLICT;
}

describe('AppException', () => {
  it('keeps domain error context without transport state', () => {
    const cause = new Error('database conflict');
    const details = [{ field: 'email', message: 'Email already exists' }];
    const exception = new TestException('Conflict', { cause, details });

    expect(exception).toBeInstanceOf(Error);
    expect(exception.name).toBe('TestException');
    expect(exception.message).toBe('Conflict');
    expect(exception.code).toBe(COMMON_ERROR_CODE.CONFLICT);
    expect(exception.details).toEqual(details);
    expect(exception.cause).toBe(cause);
    expect(exception.isOperational).toBe(true);
    expect(exception).not.toHaveProperty('status');
  });
});

describe('CommonException', () => {
  it('preserves validation details, message, and cause', () => {
    const cause = new Error('invalid input');
    const details = [{ field: 'email', message: 'Invalid email' }];
    const exception = CommonException.validation({
      message: 'Request validation failed',
      details,
      cause,
    });

    expect(exception).toBeInstanceOf(ValidationException);
    expect(exception.message).toBe('Request validation failed');
    expect(exception.code).toBe(COMMON_ERROR_CODE.VALIDATION);
    expect(exception.details).toEqual(details);
    expect(exception.cause).toBe(cause);
  });
});
