type Config = {
  apiBaseUrl: string;
};

type RuntimeConfig = {
  apiOrigin?: string;
  apiPrefix?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

const apiOrigin =
  (typeof window !== 'undefined' ? window.__APP_CONFIG__?.apiOrigin?.trim() : undefined) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

const apiPrefix =
  (typeof window !== 'undefined' ? window.__APP_CONFIG__?.apiPrefix?.trim() : undefined) ||
  '/api/v1';

export const config: Config = {
  apiBaseUrl: new URL(apiPrefix, apiOrigin).toString(),
};
