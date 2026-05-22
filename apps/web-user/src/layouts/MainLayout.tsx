import { Outlet } from 'react-router-dom';
import { Footer } from '@/components';
import { Header } from '@/components/Header';

export const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#10142C]">
      <Header />
      <main className="grow min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
