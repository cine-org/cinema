import './global.css';

export const metadata = {
  title: 'web-admin',
  description: 'Cinema Booking Admin Client',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
