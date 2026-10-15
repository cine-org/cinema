import createClient from 'openapi-fetch';
import type { paths } from '@repo/sdk-admin';

// credentials: the refresh token is an httpOnly cookie the browser must send
export const createApiClient = (apiOrigin: string) =>
  createClient<paths>({ baseUrl: apiOrigin, credentials: 'include' });
