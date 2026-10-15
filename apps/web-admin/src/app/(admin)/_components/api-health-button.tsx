'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useConfig } from '@/config/config-provider';

// /health is excluded from the OpenAPI spec, so the typed client cannot call it
async function checkApiHealth(apiOrigin: string): Promise<boolean> {
  try {
    const res = await fetch(new URL('/health', apiOrigin), { cache: 'no-store' });
    if (!res.ok) return false;
    const body = (await res.json()) as { status?: string };
    return body.status === 'ok';
  } catch {
    return false; // network error or CORS block
  }
}

// TODO: remove once a page calls the api for real
export function ApiHealthButton() {
  const { apiOrigin } = useConfig();
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    const ok = await checkApiHealth(apiOrigin);
    setPending(false);
    if (ok) toast.success('API connected');
    else toast.error(`API unreachable: ${apiOrigin}`);
  };

  return (
    <Button variant="outline" disabled={pending} onClick={() => void handleClick()}>
      {pending ? 'Testing...' : 'Test API connection'}
    </Button>
  );
}
