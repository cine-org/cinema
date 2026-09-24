import { useEffect } from 'react';
import { config } from '@/config';

const getApiHealthUrl = () => new URL('/health', config.apiOrigin).toString();

export const DashboardPage = () => {
  useEffect(() => {
    fetch(getApiHealthUrl(), {
      credentials: 'include',
    })
      .then(async (res) => {
        const data: unknown = await res.json();
        console.log('[web-admin] api health:', data);
      })
      .catch((err: unknown) => {
        console.error('[web-admin] api health fetch failed:', err);
      });
  }, []);

  return (
    <div className="flex justify-center items-center">
      <span className="text-white text-4xl font-medium">Admin Home</span>
    </div>
  );
};
