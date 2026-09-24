import { applyDecorators, HttpCode, HttpStatus, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiProperty, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { envelopeSchema, listOf, ResponseEnvelope } from './response-envelope';

export type SuccessResponseInput<T> = {
  readonly data: T;
  readonly message?: string;
};

export class SuccessResponse<T> {
  @ApiProperty({ type: Boolean, enum: [true] })
  readonly success = true;

  // Documented per route by @ApiSuccess.
  readonly data: T;

  @ApiProperty({ example: 'OK' })
  readonly message: string;

  @ApiProperty({ format: 'date-time' })
  readonly timestamp: string;

  private constructor({ data, message = 'OK' }: SuccessResponseInput<T>) {
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  static of<T>(input: SuccessResponseInput<T>): SuccessResponse<T> {
    return new SuccessResponse(input);
  }
}

// Success statuses the envelope supports; add 202 here when async jobs arrive.
type SuccessStatus = HttpStatus.OK | HttpStatus.CREATED;

type ApiSuccessOptions = {
  readonly status?: SuccessStatus;
  readonly description?: string;
};

// Documents `SuccessResponse<Dto>` and sets the status the route really returns.
// `model` is a DTO class, or `[Dto]` for a list.
export function ApiSuccess(
  model: Type | [Type],
  { status = HttpStatus.OK, description }: ApiSuccessOptions = {},
) {
  const dto = Array.isArray(model) ? model[0] : model;
  const data = Array.isArray(model) ? listOf(dto) : { $ref: getSchemaPath(dto) };

  return applyDecorators(
    ResponseEnvelope('success'),
    HttpCode(status),
    ApiExtraModels(SuccessResponse, dto),
    ApiResponse({ status, description, schema: envelopeSchema(SuccessResponse, data) }),
  );
}
