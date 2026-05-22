import type { SuccessResponse as SuccessResponseContract } from '@repo/contracts';

/**
 * Factory input
 */
export type SuccessResponseInput<T> = {
  readonly data: T;
  readonly message?: string;
};

/**
 * Internal props
 */
type SuccessResponseProps<T> = {
  readonly data: T;
  readonly message?: string;
};

/**
 * Success response wrapper
 */
export class SuccessResponse<T> implements SuccessResponseContract<T> {
  readonly success = true;
  readonly data: T;
  readonly message: string;
  readonly timestamp: string;

  private constructor({ data, message = 'OK' }: SuccessResponseProps<T>) {
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Create a new success response.
   * @param {SuccessResponseInput<T>} input
   */
  static of<T>(input: SuccessResponseInput<T>): SuccessResponse<T> {
    return new SuccessResponse(input);
  }
}
