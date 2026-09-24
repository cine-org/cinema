import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { COMMON_ERROR_CODE, type ErrorDetail } from '@repo/common';

// Swagger-only mirror of ErrorDetail, which is a plain type.
@ApiSchema({ name: 'ErrorDetail' })
class ErrorDetailSchema implements ErrorDetail {
  @ApiPropertyOptional({ example: 'email' })
  readonly field?: string;

  @ApiProperty({ example: 'Invalid email' })
  readonly message!: string;

  @ApiPropertyOptional({ example: 'invalid_format' })
  readonly code?: string;
}

export type ErrorResponseInput = {
  readonly message: string;
  readonly code?: string;
  readonly errors?: ErrorDetail[];
  readonly requestId?: string;
};

type ErrorResponseProps = {
  readonly message: string;
  readonly code: string;
  readonly errors?: ErrorDetail[];
  readonly requestId?: string;
};

export class ErrorResponse {
  @ApiProperty({ type: Boolean, enum: [false] })
  readonly success = false;

  @ApiProperty({ example: 'Request timed out' })
  readonly message: string;

  @ApiProperty({ example: 'REQUEST_TIMEOUT' })
  readonly code: string;

  @ApiPropertyOptional({ type: [ErrorDetailSchema] })
  readonly errors?: ErrorDetail[];

  @ApiProperty({ format: 'date-time' })
  readonly timestamp: string;

  @ApiPropertyOptional()
  readonly requestId?: string;

  private constructor({ message, code, errors, requestId }: ErrorResponseProps) {
    this.message = message;
    this.code = code;
    this.errors = errors;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
  }

  static of({
    message,
    code = COMMON_ERROR_CODE.INTERNAL,
    errors,
    requestId,
  }: ErrorResponseInput): ErrorResponse {
    return new ErrorResponse({
      message,
      code,
      errors,
      requestId,
    });
  }
}
