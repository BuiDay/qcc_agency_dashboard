import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ErrorCode } from '@qcc/shared';
import { Request, Response } from 'express';

@Catch(HttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const responseCode =
      typeof exceptionResponse === 'string' &&
      Object.values(ErrorCode).some((value) => value === exceptionResponse)
        ? exceptionResponse
        : undefined;
    const code = responseCode ?? this.errorCode(status);
    const details =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? (exceptionResponse as { message?: unknown }).message
        : undefined;
    response.status(status).json({
      statusCode: status,
      code,
      message: code,
      ...(Array.isArray(details) ? { details } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private errorCode(status: number): ErrorCode | string {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.Unauthorized;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.Forbidden;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NotFound;
      case HttpStatus.CONFLICT:
        return ErrorCode.Conflict;
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.ValidationFailed;
      default:
        return `HTTP_${status}`;
    }
  }
}
