import { useEffect } from 'react';
import { config } from '@/config';

const getApiHealthUrl = () => new URL('/health', config.apiBaseUrl).toString();

export const HomePage = () => {
  useEffect(() => {
    fetch(getApiHealthUrl(), {
      credentials: 'include',
    })
      .then(async (res) => {
        const data: unknown = await res.json();
        console.log('[web-user] api health:', data);
      })
      .catch((err: unknown) => {
        console.error('[web-user] api health fetch failed:', err);
      });
  }, []);

  return (
    <div className="flex justify-center items-center">
      <span className="text-8xl font-medium text-white">Home</span>
    </div>
  );
};
