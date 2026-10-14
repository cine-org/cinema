'use client';

import clsx from 'clsx';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { isActive, NAV_ITEMS } from './nav-items';

// phone fits ~4 icons next to the hamburger; the rest live in the drawer
const QUICK_ITEMS = NAV_ITEMS.slice(0, 4);

export const BottomNav = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const closeDrawer = () => setOpen(false);
  const toggleDrawer = () => setOpen((o) => !o);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={closeDrawer}>
          <div
            className="absolute inset-x-0 bottom-16 rounded-t-2xl bg-white p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={closeDrawer}
                aria-current={isActive(pathname, href) ? 'page' : undefined}
                className={clsx(
                  'flex h-12 items-center gap-3 rounded-lg px-3 text-sm',
                  isActive(pathname, href) ? 'bg-zinc-100 font-medium' : 'hover:bg-zinc-50',
                )}
              >
                <Icon size={20} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex h-16 border-t border-zinc-200 bg-white md:hidden"
      >
        {QUICK_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={isActive(pathname, href) ? 'page' : undefined}
            className={clsx(
              'flex flex-1 items-center justify-center',
              isActive(pathname, href) ? 'text-rose-700' : 'text-zinc-600',
            )}
          >
            <Icon size={22} />
          </Link>
        ))}
        <button
          type="button"
          onClick={toggleDrawer}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="flex flex-1 items-center justify-center text-zinc-600"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
    </>
  );
};
