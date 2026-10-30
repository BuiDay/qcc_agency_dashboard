import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import {
  AuthController,
  cookieDomainOptions,
} from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

describe('cookieDomainOptions', () => {
  it.each(['localhost', 'localhost:3000', 'http://localhost:3000', '127.0.0.1'])(
    'omits Domain for local host configuration: %s',
    (configuredDomain) => {
      expect(cookieDomainOptions(configuredDomain)).toEqual({});
    },
  );

  it('uses only the hostname from an absolute production URL', () => {
    expect(cookieDomainOptions('https://app.example.com:3000')).toEqual({
      domain: 'app.example.com',
    });
  });
});

describe('AuthController refresh cookies', () => {
  const config = {
    get: jest.fn().mockReturnValue(undefined),
  } as unknown as ConfigService;
  const response = {
    clearCookie: jest.fn(),
    cookie: jest.fn(),
  } as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears stale refresh cookies when refresh is unauthorized', async () => {
    const auth = {
      refresh: jest
        .fn()
        .mockRejectedValue(new UnauthorizedException('UNAUTHORIZED')),
    } as unknown as AuthService;
    const controller = new AuthController(auth, config);

    await expect(
      controller.refresh(
        { cookies: { qcc_refresh: 'stale-token' } } as unknown as Request,
        response,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(auth.refresh).toHaveBeenCalledWith('stale-token');
    expect(response.clearCookie).toHaveBeenCalledWith('qcc_refresh', {
      path: '/api/auth',
    });
    expect(response.clearCookie).toHaveBeenCalledWith('qcc_refresh', {
      path: '/',
    });
    expect(response.clearCookie).toHaveBeenCalledWith('refresh_token', {
      path: '/',
    });
  });

  it('does not clear cookies when no refresh token was sent', async () => {
    const auth = {
      refresh: jest
        .fn()
        .mockRejectedValue(new UnauthorizedException('UNAUTHORIZED')),
    } as unknown as AuthService;
    const controller = new AuthController(auth, config);

    await expect(
      controller.refresh(
        { cookies: {}, headers: {} } as unknown as Request,
        response,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(auth.refresh).toHaveBeenCalledWith(undefined);
    expect(response.clearCookie).not.toHaveBeenCalled();
  });

  it('prefers the canonical refresh cookie and falls back to the legacy name', async () => {
    const auth = {
      refresh: jest.fn().mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      }),
    } as unknown as AuthService;
    const controller = new AuthController(auth, config);

    await controller.refresh(
      {
        cookies: {
          qcc_refresh: 'canonical-token',
          refresh_token: 'legacy-token',
        },
      } as unknown as Request,
      response,
    );

    expect(auth.refresh).toHaveBeenCalledWith('canonical-token');
  });
});
