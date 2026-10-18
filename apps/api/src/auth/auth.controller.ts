import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CurrentActor } from '../common/decorators/current-actor.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Actor } from '../common/interfaces/actor.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
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
    this.setCookies(response, result.accessToken, result.refreshToken);
    return { user: result.user, member: result.member };
  }

  @Post('refresh')
  @Public()
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.auth.refresh(request.cookies?.qcc_refresh);
    this.setCookies(response, tokens.accessToken, tokens.refreshToken);
    return { success: true };
  }

  @Post('logout')
  @Public()
  logout(
    @Res({ passthrough: true }) response: Response,
  ) {
    const domain = this.config.get<string>('COOKIE_DOMAIN');
    const cookieOptions = domain ? { domain } : {};
    response.clearCookie('qcc_access', { path: '/', ...cookieOptions });
    response.clearCookie('qcc_refresh', {
      path: '/api/auth',
      ...cookieOptions,
    });
    return { success: true };
  }

  @Get('me')
  @ApiCookieAuth('qcc_access')
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
    const domain = this.config.get<string>('COOKIE_DOMAIN');
    const common = {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      ...(domain ? { domain } : {}),
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
