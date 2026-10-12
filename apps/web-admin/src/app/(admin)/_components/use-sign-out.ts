'use client';

import { useRouter } from 'next/navigation';

export const useSignOut = () => {
  const router = useRouter();

  // TODO: call the logout api and clear the session before redirecting
  return () => router.push('/login');
};
