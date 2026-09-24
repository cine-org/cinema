type RuntimeConfig = {
  apiOrigin?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

type Config = {
  apiOrigin: string;
};

// Only the origin: generated api-client paths already carry `/api/v1`.
export const config: Config = {
  apiOrigin:
    (typeof window !== 'undefined' ? window.__APP_CONFIG__?.apiOrigin?.trim() : undefined) ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
};
