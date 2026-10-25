'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

type Mode = 'full' | 'minimal';

type SidebarState = {
  // pinned width on desktop; the sidebar also widens temporarily on hover
  expanded: boolean;
  hovered: boolean;
  // md and up: the sidebar is part of the layout. Below md it is a drawer
  isDesktop: boolean;
  mobileOpen: boolean;
  toggle: () => void;
  closeMobile: () => void;
  setHovered: (hovered: boolean) => void;
};

const SidebarContext = createContext<SidebarState | null>(null);

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used inside SidebarProvider');
  return ctx;
};

// server snapshot assumes a wide screen, the client corrects it right after hydration
const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => true,
  );

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isXl = useMediaQuery('(min-width: 1280px)');

  // a manual choice only holds at the breakpoint where it was made
  const [pinned, setPinned] = useState<{ mode: Mode; atXl: boolean } | null>(null);
  // the drawer closes by itself when the route changes
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  const mobileOpen = !isDesktop && openedAt === pathname;
  const expanded = pinned && pinned.atXl === isXl ? pinned.mode === 'full' : isXl;

  const closeMobile = () => setOpenedAt(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpenedAt(null);
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const toggle = () => {
    if (!isDesktop) {
      setOpenedAt(mobileOpen ? null : pathname);
      return;
    }
    setPinned({ mode: expanded ? 'minimal' : 'full', atXl: isXl });
    setHovered(false);
  };

  return (
    <SidebarContext.Provider
      value={{ expanded, hovered, isDesktop, mobileOpen, toggle, closeMobile, setHovered }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
