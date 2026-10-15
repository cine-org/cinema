'use client';

import { useMemo } from 'react';
import { useConfig } from '@/config/config-provider';
import { createApiClient } from '@/lib/api/client';

export function useApiClient() {
  const { apiOrigin } = useConfig();
  return useMemo(() => createApiClient(apiOrigin), [apiOrigin]);
}
