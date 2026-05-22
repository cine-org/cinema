import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';
import { COMMON_ERROR_CODE, createErrorResponse, type ErrorDetail } from '../responses';

const DEFAULT_STATUS_ERROR_CODE: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: COMMON_ERROR_CODE.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: COMMON_ERROR_CODE.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: COMMON_ERROR_CODE.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: COMMON_ERROR_CODE.NOT_FOUND,
  [HttpStatus.REQUEST_TIMEOUT]: COMMON_ERROR_CODE.TIMEOUT,
  [HttpStatus.CONFLICT]: COMMON_ERROR_CODE.CONFLICT,
  [HttpStatus.UNPROCESSABLE_ENTITY]: COMMON_ERROR_CODE.UNPROCESSABLE_ENTITY,
  [HttpStatus.TOO_MANY_REQUESTS]: COMMON_ERROR_CODE.TOO_MANY_REQUESTS,
  [HttpStatus.INTERNAL_SERVER_ERROR]: COMMON_ERROR_CODE.INTERNAL,
  [HttpStatus.NOT_IMPLEMENTED]: COMMON_ERROR_CODE.NOT_IMPLEMENTED,
  [HttpStatus.SERVICE_UNAVAILABLE]: COMMON_ERROR_CODE.SERVICE_UNAVAILABLE,
  [HttpStatus.GATEWAY_TIMEOUT]: COMMON_ERROR_CODE.GATEWAY_TIMEOUT,
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const requestId = this.getRequestId(response);

    if (exception instanceof ZodError) {
      return response.status(HttpStatus.BAD_REQUEST).json(
        createErrorResponse({
          message: 'Validation failed',
          code: COMMON_ERROR_CODE.VALIDATION,
          errors: this.mapZodDetails(exception),
          requestId,
        }),
      );
    }

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, response, requestId);
    }

    console.error(exception);

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      createErrorResponse({
        message: 'Internal server error',
        code: COMMON_ERROR_CODE.INTERNAL,
        requestId,
      }),
    );
  }

  private handleHttpException(exception: HttpException, response: Response, requestId?: string) {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const fallbackCode = this.getDefaultCode(status);

    if (typeof exceptionResponse === 'string') {
      return response.status(status).json(
        createErrorResponse({
          message: exceptionResponse,
          code: fallbackCode,
          requestId,
        }),
      );
    }

    if (this.isRecord(exceptionResponse)) {
      const message = this.getHttpExceptionMessage(exceptionResponse);
      const errors = this.getHttpExceptionDetails(exceptionResponse);
      const code =
        typeof exceptionResponse.code === 'string' ? exceptionResponse.code : fallbackCode;

      return response.status(status).json(
        createErrorResponse({
          message,
          code,
          errors,
          requestId,
        }),
      );
    }

    return response.status(status).json(
      createErrorResponse({
        message: 'Internal server error',
        code: fallbackCode,
        requestId,
      }),
    );
  }

  private getHttpExceptionMessage(response: Record<string, unknown>) {
    if (typeof response.message === 'string') {
      return response.message;
    }

    if (Array.isArray(response.message)) {
      return 'Validation failed';
    }

    if (typeof response.error === 'string') {
      return response.error;
    }

    return 'Internal server error';
  }

  private getHttpExceptionDetails(response: Record<string, unknown>): ErrorDetail[] | undefined {
    if (Array.isArray(response.errors)) {
      return response.errors.filter(this.isErrorDetail);
    }

    if (Array.isArray(response.message)) {
      const details = response.message
        .filter((message): message is string => typeof message === 'string')
        .map((message) => ({ message }));

      return details.length > 0 ? details : undefined;
    }

    return undefined;
  }

  private mapZodDetails(error: ZodError): ErrorDetail[] {
    return error.issues.map((issue) => ({
      field: issue.path.join('.') || undefined,
      message: issue.message,
      code: issue.code,
    }));
  }

  private getDefaultCode(status: number) {
    return DEFAULT_STATUS_ERROR_CODE[status] ?? COMMON_ERROR_CODE.INTERNAL;
  }

  private getRequestId(response: Response) {
    const header = response.getHeader('x-request-id');

    if (typeof header === 'string') {
      return header;
    }

    if (typeof header === 'number') {
      return String(header);
    }

    return undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isErrorDetail(value: unknown): value is ErrorDetail {
    if (!this.isRecord(value)) {
      return false;
    }

    return typeof value.message === 'string';
  }
}
