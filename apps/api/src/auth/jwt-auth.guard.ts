import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '@qcc/shared';
import type { Request } from 'express';
import { IS_PUBLIC } from '../common/actor';
import { AppException } from '../common/app-exception';
import { AuthService } from './auth.service';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

// Guard toàn cục: mọi route cần đăng nhập, trừ route gắn @Public()
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request & { actor?: unknown }>();
    // Ưu tiên cookie (web), sau đó header Bearer (Swagger, Postman, app mobile sau này)
    const header = req.headers.authorization;
    const token = req.cookies?.[ACCESS_COOKIE] ?? (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
    if (!token) throw new AppException(ErrorCode.Unauthorized, HttpStatus.UNAUTHORIZED);

    req.actor = await this.auth.authenticate(token);
    return true;
  }
}
