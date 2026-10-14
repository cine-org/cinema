'use client';

import clsx from 'clsx';
import { Bell, ChevronRight, Search, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isActive, NAV_ITEMS } from './nav-items';
import { UserMenu } from './user-menu';

export const Header = () => {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((item) => isActive(pathname, item.href));

  // phone only: the search input replaces the rest of the header while open
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
      <nav aria-label="Breadcrumb" className={clsx(searchOpen && 'max-md:hidden')}>
        <ol className="flex items-center gap-2 text-sm">
          <li className="text-muted-foreground">Cinema</li>
          {current && (
            <>
              <li aria-hidden className="text-muted-foreground">
                <ChevronRight className="size-4" />
              </li>
              <li aria-current="page" className="font-medium">
                {current.label}
              </li>
            </>
          )}
        </ol>
      </nav>

      <div
        className={clsx(
          'flex items-center gap-2',
          searchOpen ? 'flex-1 md:ml-auto md:flex-none' : 'ml-auto',
        )}
      >
        <div className={clsx('relative md:block md:w-64', searchOpen ? 'flex-1' : 'hidden')}>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            aria-label="Quick search"
            placeholder="Quick search..."
            className="pl-9"
            onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Search"
          className={clsx('md:hidden', searchOpen && 'hidden')}
          onClick={() => setSearchOpen(true)}
        >
          <Search />
        </Button>
        {searchOpen && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close search"
            className="md:hidden"
            onClick={() => setSearchOpen(false)}
          >
            <X />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          aria-label="Notifications"
          className={clsx(searchOpen && 'max-md:hidden')}
        >
          <Bell />
        </Button>
        {/* on desktop the user lives at the bottom of the sidebar */}
        <div className={clsx('md:hidden', searchOpen && 'hidden')}>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
