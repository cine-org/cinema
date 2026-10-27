import { Injectable } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { API_DEFAULT_VERSION, API_PREFIX } from '@/bootstrap/setup-http';
import { ConfigService } from '@/config';

const API_ROOT = `/${API_PREFIX}/v${API_DEFAULT_VERSION}`;

// The refresh token lives only in this cookie: HttpOnly so scripts cannot read it, Strict so
// cross-site requests do not carry it, and scoped to its side's auth routes, never sent to the rest
// of the api. Each side has its own cookie, so signing in on one never replaces the other.
abstract class SurfaceRefreshCookie {
  private readonly options: CookieOptions;

  protected constructor(
    config: ConfigService,
    private readonly name: string,
    path: string,
  ) {
    this.options = {
      httpOnly: true,
      // Plain http only in local development, where browsers would drop a Secure cookie.
      secure: new URL(config.app.apiOrigin).protocol === 'https:',
      sameSite: 'strict',
      path,
    };
  }

  // Express has no cookie parsing without middleware; these are the only cookies the api reads.
  read(request: Request): string | null {
    for (const part of (request.headers.cookie ?? '').split(';')) {
      const separator = part.indexOf('=');
      if (separator === -1 || part.slice(0, separator).trim() !== this.name) continue;
      const value = part.slice(separator + 1).trim();
      return value === '' ? null : value;
    }
    return null;
  }

  set(response: Response, token: string, expiresAt: Date): void {
    response.cookie(this.name, token, { ...this.options, expires: expiresAt });
  }

  clear(response: Response): void {
    response.clearCookie(this.name, this.options);
  }
}

// Customers, on /auth.
@Injectable()
export class RefreshCookie extends SurfaceRefreshCookie {
  constructor(config: ConfigService) {
    super(config, 'refresh_token', `${API_ROOT}/auth`);
  }
}

// Internal accounts, on /admin/auth.
@Injectable()
export class AdminRefreshCookie extends SurfaceRefreshCookie {
  constructor(config: ConfigService) {
    super(config, 'admin_refresh_token', `${API_ROOT}/admin/auth`);
  }
}
