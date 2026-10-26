'use client';

import { cn } from '@/lib/utils';
import { Ellipsis, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/search-input';
import { BrandMark } from '../shell/brand';
import { NotificationMenu } from './notification-menu';
import { SidebarToggleIcon } from '../sidebar/sidebar-toggle-icon';
import { useSidebar } from '../shell/sidebar-context';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

export const Header = () => {
  const { isDesktop, mobileOpen, toggle } = useSidebar();
  // phones only: the search field takes over the first row while open
  const [searchOpen, setSearchOpen] = useState(false);
  // phones only: theme, notifications and user sit in a second row behind the dots button
  const [actionsOpen, setActionsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background md:z-30">
      <div className="flex flex-col md:h-19 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex h-14 items-center gap-3 px-4 md:h-auto md:flex-1 md:px-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle sidebar"
            aria-expanded={isDesktop ? undefined : mobileOpen}
            className={cn('size-10', searchOpen && 'max-md:hidden')}
            onClick={toggle}
          >
            <SidebarToggleIcon open={mobileOpen} />
          </Button>

          <Link
            href="/"
            aria-label="Cinema"
            className={cn('md:hidden', searchOpen && 'max-md:hidden')}
          >
            <span className="flex items-center gap-2 text-lg font-semibold">
              <BrandMark />
              Cinema
            </span>
          </Link>

          <SearchInput
            wrapperClassName={cn(
              'md:block md:w-72 xl:w-107.5',
              searchOpen ? 'block flex-1' : 'hidden',
            )}
            ref={inputRef}
            aria-label="Search"
            placeholder="Search..."
            onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
          />

          <div className="ml-auto flex items-center gap-1 md:hidden">
            {searchOpen ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
              >
                <X />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Search"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle actions"
                  aria-expanded={actionsOpen}
                  onClick={() => setActionsOpen((o) => !o)}
                >
                  <Ellipsis />
                </Button>
              </>
            )}
          </div>
        </div>

        <div
          className={cn(
            'items-center justify-between gap-3 border-t border-border px-4 py-3 shadow-md md:flex md:justify-end md:border-t-0 md:p-0 md:shadow-none',
            actionsOpen ? 'flex' : 'hidden',
          )}
        >
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationMenu />
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
