import type { Metadata } from 'next';
import Script from 'next/script';
import './global.css';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: { default: 'Cinema Admin', template: '%s | Cinema Admin' },
  description: 'Cinema Booking Admin',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body className="antialiased">
        <Script src="/runtime-config" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
