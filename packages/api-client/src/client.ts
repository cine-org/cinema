import createClient, { type Client } from 'openapi-fetch';
import type { paths } from './generated/openapi/types';

export type ApiClient = Client<paths>;

export type ApiClientConfig = {
  readonly baseUrl: string;
  readonly getToken?: () => Promise<string | null> | string | null;
  readonly onUnauthorized?: () => Promise<void> | void;
};

export function createApiClient({ baseUrl, getToken, onUnauthorized }: ApiClientConfig): ApiClient {
  const client = createClient<paths>({
    baseUrl,
  });

  client.use({
    async onRequest({ request }) {
      const token = await getToken?.();

      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`);
      }

      return request;
    },

    async onResponse({ response }) {
      if (response.status === 401) {
        await onUnauthorized?.();
      }

      return response;
    },
  });

  return client;
}
