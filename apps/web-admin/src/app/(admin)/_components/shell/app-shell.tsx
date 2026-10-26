'use client';

import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { AppSidebar } from '../sidebar/app-sidebar';
import { Breadcrumb } from '../nav/breadcrumb';
import { Header } from '../header/header';
import { SidebarProvider, useSidebar } from './sidebar-context';

const Content = ({ children }: { children: React.ReactNode }) => {
  const { expanded, isDesktop } = useSidebar();

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col transition-[margin] duration-300 ease-in-out',
        isDesktop ? (expanded ? 'ml-72.5' : 'ml-22.5') : 'ml-0',
      )}
    >
      <Header />
      <div className="flex-1 p-4 md:p-6">
        <Breadcrumb />
        {children}
      </div>
    </div>
  );
};

export const AppShell = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <AppSidebar />
    <Content>{children}</Content>
    <Toaster position="top-right" />
  </SidebarProvider>
);
