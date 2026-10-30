import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { isIP } from 'node:net';
import { Request, Response } from 'express';
import { CurrentActor } from '../common/decorators/current-actor.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Actor } from '../common/interfaces/actor.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

export function cookieDomainOptions(
  configuredDomain: string | undefined,
): { domain?: string } {
  const configured = configuredDomain?.trim();
  if (!configured) return {};

  let hostname: string;
  try {
    hostname = new URL(
      configured.includes('://') ? configured : `http://${configured}`,
    ).hostname;
  } catch {
    throw new Error('COOKIE_DOMAIN must contain a valid hostname.');
  }

  if (hostname === 'localhost' || isIP(hostname)) return {};
  return { domain: hostname };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @Public()
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(dto);
    this.clearLegacyRefreshCookies(response);
    this.setCookies(response, result.accessToken, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
      member: result.member,
    };
  }

  @Post('refresh')
  @Public()
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken =
      request.cookies?.qcc_refresh || request.cookies?.refresh_token;
    if (!refreshToken) {
      const parsedCookieNames = Object.keys(request.cookies ?? {});
      const headerCookieNames = (request.headers.cookie ?? '')
        .split(';')
        .map((cookie) => cookie.trim().split('=', 1)[0])
        .filter(Boolean);
      this.logger.warn(
        `Refresh cookie missing (parsed=${parsedCookieNames.join(',') || 'none'}, header=${headerCookieNames.join(',') || 'none'}).`,
      );
    }
    let tokens: Awaited<ReturnType<AuthService['refresh']>>;
    try {
      tokens = await this.auth.refresh(refreshToken);
    } catch (error) {
      if (refreshToken && error instanceof UnauthorizedException) {
        this.clearRefreshCookies(response);
      }
      throw error;
    }
    this.setCookies(response, tokens.accessToken, tokens.refreshToken);
    this.clearLegacyRefreshCookies(response);
    return { success: true, accessToken: tokens.accessToken };
  }

  @Post('logout')
  @Public()
  logout(
    @Res({ passthrough: true }) response: Response,
  ) {
    this.clearRefreshCookies(response);
    return { success: true };
  }

  private clearRefreshCookies(response: Response): void {
    const cookieOptions = cookieDomainOptions(
      this.config.get<string>('COOKIE_DOMAIN'),
    );
    response.clearCookie('qcc_access', { path: '/', ...cookieOptions });
    response.clearCookie('qcc_refresh', {
      path: '/api/auth',
      ...cookieOptions,
    });
    this.clearLegacyRefreshCookies(response);
  }

  private clearLegacyRefreshCookies(response: Response): void {
    const cookieOptions = cookieDomainOptions(
      this.config.get<string>('COOKIE_DOMAIN'),
    );
    response.clearCookie('qcc_refresh', { path: '/', ...cookieOptions });
    response.clearCookie('refresh_token', { path: '/', ...cookieOptions });
  }

  @Get('me')
  @ApiCookieAuth('qcc_access')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  current(@CurrentActor() actor: Actor) {
    return this.auth.current(actor);
  }

  private setCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const secure = this.config.get('NODE_ENV') === 'production';
    const common = {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      ...cookieDomainOptions(this.config.get<string>('COOKIE_DOMAIN')),
    };
    response.cookie('qcc_access', accessToken, {
      ...common,
      path: '/',
      maxAge: 15 * 60 * 1000,
    });
    response.cookie('qcc_refresh', refreshToken, {
      ...common,
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
