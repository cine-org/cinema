import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from './app-sidebar';
import { BottomNav } from './bottom-nav';
import { Header } from './header';

type AppShellProps = { children: React.ReactNode };

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <div className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</div>
        </SidebarInset>
        <BottomNav />
      </SidebarProvider>
      <Toaster position="top-right" />
    </TooltipProvider>
  );
};
