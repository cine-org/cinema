import './global.css';

export const metadata = {
  title: 'web-user',
  description: 'Cinema Booking Web Client',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
