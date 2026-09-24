import {
  BadRequestException,
  Injectable,
  ValidationPipe,
  type ValidationError,
} from '@nestjs/common';
import { COMMON_ERROR_CODE, type ErrorDetail } from '@repo/common';

// Validates every @Body/@Query/@Param DTO with class-validator; failures become ErrorResponse details.
@Injectable()
export class RequestValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'Validation failed',
          code: COMMON_ERROR_CODE.VALIDATION,
          errors: toErrorDetails(errors),
        }),
    });
  }
}

// Nested DTO errors get a dotted field path, e.g. `address.city`.
function toErrorDetails(errors: ValidationError[], parent?: string): ErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.entries(error.constraints ?? {}).map(([code, message]) => ({
      field,
      message,
      code,
    }));

    return [...own, ...toErrorDetails(error.children ?? [], field)];
  });
}
