import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { Actor, CurrentActor, Public } from '../common/actor';
import { LoginDto } from './auth.dto';
import { AuthService } from './auth.service';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  /** Đăng nhập: set cookie httpOnly, đồng thời trả accessToken để test bằng Swagger */
  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, me } = await this.auth.login(dto.email, dto.password);
    this.setCookies(res, accessToken, refreshToken);
    return { accessToken, me };
  }

  /** Cấp access token mới từ refresh token trong cookie */
  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.auth.refresh(req.cookies?.[REFRESH_COOKIE]);
    this.setCookies(res, accessToken, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_COOKIE, this.cookieBase());
    res.clearCookie(REFRESH_COOKIE, { ...this.cookieBase(), path: '/auth' });
    return { ok: true };
  }

  /** Thông tin người đang đăng nhập (member + user) */
  @Get('me')
  me(@CurrentActor() actor: Actor) {
    return this.auth.me({ sub: actor.userId, mid: actor.memberId, wid: actor.workspaceId });
  }

  private cookieBase(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('COOKIE_SECURE') === 'true',
    };
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(ACCESS_COOKIE, accessToken, { ...this.cookieBase(), path: '/' });
    // Refresh token chỉ gửi kèm khi gọi /auth/*
    res.cookie(REFRESH_COOKIE, refreshToken, { ...this.cookieBase(), path: '/auth' });
  }
}
