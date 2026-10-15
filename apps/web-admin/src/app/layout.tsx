import type { Metadata } from 'next';
import './global.css';
import { Geist } from 'next/font/google';
import { ConfigProvider } from '@/config/config-provider';
import { getConfig } from '@/config/get-config';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: { default: 'Cinema Admin', template: '%s | Cinema Admin' },
  description: 'Cinema Booking Admin',
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await getConfig();

  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body className="antialiased">
        <ConfigProvider value={config}>{children}</ConfigProvider>
      </body>
    </html>
  );
}
