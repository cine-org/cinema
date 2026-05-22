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
  window.__APP_CONFIG__?.apiOrigin?.trim() ||
  import.meta.env.VITE_API_ORIGIN?.trim() ||
  window.location.origin;
const apiPrefix =
  window.__APP_CONFIG__?.apiPrefix?.trim() || import.meta.env.VITE_API_PREFIX?.trim() || '/api/v1';

type Config = {
  apiBaseUrl: string;
};

export const config: Config = {
  apiBaseUrl: new URL(apiPrefix, apiOrigin).toString(),
};
