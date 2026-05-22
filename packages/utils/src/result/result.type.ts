/** @template T */
export type Ok<T> = {
  readonly ok: true;
  readonly value: T;
};

/** @template E */
export type Err<E> = {
  readonly ok: false;
  readonly error: E;
};

/**
 * Success or error result.
 * @template T
 * @template E
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Helper utilities for working with Result values.
 */
export const Result = {
  /**
   * Create an Ok result.
   * @template T
   * @param {T} value
   */
  ok: <T>(value: T): Ok<T> => ({
    ok: true,
    value,
  }),

  /**
   * Create an Err result.
   * @template E
   * @param {E} error
   */
  err: <E>(error: E): Err<E> => ({
    ok: false,
    error,
  }),

  /**
   * Check if result is ok.
   */
  isOk: <T, E>(r: Result<T, E>): r is Ok<T> => r.ok,

  /**
   * Check if result is error.
   */
  isErr: <T, E>(r: Result<T, E>): r is Err<E> => !r.ok,
};
