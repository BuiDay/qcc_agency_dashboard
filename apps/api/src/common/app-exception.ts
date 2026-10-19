import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@qcc/shared';

// Lỗi nghiệp vụ: luôn trả { code, message } để frontend dịch theo code
export class AppException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    message?: string,
  ) {
    super({ code, message: message ?? code }, status);
  }
}

export const notFound = (code: ErrorCode = ErrorCode.NotFound) =>
  new AppException(code, HttpStatus.NOT_FOUND);

export const forbidden = (code: ErrorCode = ErrorCode.Forbidden) =>
  new AppException(code, HttpStatus.FORBIDDEN);
