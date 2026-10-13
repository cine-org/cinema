import { Injectable } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { API_DEFAULT_VERSION, API_PREFIX } from '@/bootstrap/setup-http';
import { ConfigService } from '@/config';

const NAME = 'refresh_token';
// Sent only to the auth routes, never to the rest of the api.
const PATH = `/${API_PREFIX}/v${API_DEFAULT_VERSION}/auth`;

// The refresh token lives only in this cookie: HttpOnly so scripts cannot read it, Strict so
// cross-site requests do not carry it.
@Injectable()
export class RefreshCookie {
  private readonly options: CookieOptions;

  constructor(config: ConfigService) {
    this.options = {
      httpOnly: true,
      // Plain http only in local development, where browsers would drop a Secure cookie.
      secure: new URL(config.app.apiOrigin).protocol === 'https:',
      sameSite: 'strict',
      path: PATH,
    };
  }

  // Express has no cookie parsing without middleware; this is the only cookie the api reads.
  read(request: Request): string | null {
    for (const part of (request.headers.cookie ?? '').split(';')) {
      const separator = part.indexOf('=');
      if (separator === -1 || part.slice(0, separator).trim() !== NAME) continue;
      const value = part.slice(separator + 1).trim();
      return value === '' ? null : value;
    }
    return null;
  }

  set(response: Response, token: string, expiresAt: Date): void {
    response.cookie(NAME, token, { ...this.options, expires: expiresAt });
  }

  clear(response: Response): void {
    response.clearCookie(NAME, this.options);
  }
}
