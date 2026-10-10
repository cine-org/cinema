import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: process.platform === 'win32' ? undefined : 'standalone',
  transpilePackages: ['@repo/sdk-user', '@repo/utils'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
