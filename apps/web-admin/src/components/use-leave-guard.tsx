'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';

// asks before the page is left while there are unsaved changes: closing or reloading the tab,
// and following any link on the page. The browser back button is not covered.
export const useLeaveGuard = (dirty: boolean) => {
  const router = useRouter();
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest('a');
      if (!link || link.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setNext(url.pathname + url.search + url.hash);
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);

  return (
    <ConfirmDialog
      open={next !== null}
      onOpenChange={(open) => !open && setNext(null)}
      title="Leave this page?"
      description="You have changes that are not saved. They are lost if you leave."
      confirmLabel="Leave"
      destructive
      onConfirm={() => next && router.push(next)}
    />
  );
};
