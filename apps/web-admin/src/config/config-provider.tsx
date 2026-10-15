'use client';

import { createContext, use } from 'react';

// Only the origin: generated sdk-admin paths already carry `/api/v1`.
export type AppConfig = { apiOrigin: string };

const ConfigContext = createContext<AppConfig | null>(null);

export function ConfigProvider({
  value,
  children,
}: {
  value: AppConfig;
  children: React.ReactNode;
}) {
  return <ConfigContext value={value}>{children}</ConfigContext>;
}

export function useConfig(): AppConfig {
  const config = use(ConfigContext);
  if (!config) throw new Error('useConfig must be used inside <ConfigProvider>');
  return config;
}
