'use client';

import { useEffect } from 'react';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-zinc-600">An unexpected error occurred. Please try again.</p>
      <button
        type="button"
        onClick={reset}
        className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Try again
      </button>
    </div>
  );
}
