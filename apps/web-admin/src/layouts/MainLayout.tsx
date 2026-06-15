import { Footer } from '@/components';
import { Header } from '@/components/Header';

type MainLayoutProps = {
  children: React.ReactNode;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#10142C]">
      <Header />
      <main className="grow min-h-screen">{children}</main>
      <Footer />
    </div>
  );
};
