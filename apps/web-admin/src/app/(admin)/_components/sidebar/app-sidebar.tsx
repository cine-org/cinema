'use client';

import { cn } from '@/lib/utils';
import { ChevronDown, Ellipsis } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BrandMark } from '../shell/brand';
import { isActive, NAV_GROUPS, type NavItem } from '../nav/nav-items';
import { useSidebar } from '../shell/sidebar-context';

// icons keep the same x in every width, so only the label fades and the aside clips it
const ITEM = 'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium';
const ITEM_ACTIVE = 'bg-sidebar-accent text-sidebar-accent-foreground';
const ITEM_IDLE = 'text-sidebar-foreground hover:bg-sidebar-accent';

const SubMenu = ({ item, open, pathname }: { item: NavItem; open: boolean; pathname: string }) => (
  <div
    className={cn(
      'grid transition-[grid-template-rows] duration-300',
      open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
    )}
  >
    <ul inert={!open} className="ms-9 space-y-1 overflow-hidden">
      {item.children?.map(({ label, href }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href} className="first:mt-2">
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(ITEM, 'py-2.5', active ? ITEM_ACTIVE : ITEM_IDLE)}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  </div>
);

export const AppSidebar = () => {
  const pathname = usePathname();
  const { expanded, hovered, isDesktop, mobileOpen, closeMobile, setHovered } = useSidebar();

  // the drawer and the hover state always show the full sidebar
  const full = !isDesktop || expanded || hovered;
  const label = cn('whitespace-nowrap transition-opacity duration-300', !full && 'opacity-0');

  // which section is open: the user's last toggle on this page, else the one holding the page
  const [toggled, setToggled] = useState<{ path: string; href: string | null } | null>(null);
  const activeSection = NAV_GROUPS.flatMap((g) => g.items).find(
    (i) => i.children && isActive(pathname, i.href),
  )?.href;
  const openHref = toggled?.path === pathname ? toggled.href : (activeSection ?? null);

  return (
    <>
      {/* starts below the header on phones so the header's toggle stays clickable */}
      <div
        aria-hidden
        onClick={closeMobile}
        className={cn(
          'fixed inset-x-0 top-14 bottom-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        inert={!isDesktop && !mobileOpen}
        onMouseEnter={() => isDesktop && !expanded && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'fixed bottom-0 left-0 z-50 flex flex-col overflow-hidden border-r border-sidebar-border bg-sidebar px-5 text-sidebar-foreground transition-[width,transform,box-shadow] duration-300 ease-in-out',
          'top-14 md:top-0',
          full ? 'w-72.5' : 'w-22.5',
          isDesktop || mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // floats over the content while the pinned width is minimal
          hovered && !expanded && 'shadow-xl',
        )}
      >
        <div className="flex py-8 max-md:hidden">
          <Link href="/" aria-label="Cinema" className="ms-1 flex items-center gap-3">
            <BrandMark />
            <span className={cn(label, 'text-xl font-semibold')}>Cinema</span>
          </Link>
        </div>

        <nav
          aria-label="Main navigation"
          className="no-scrollbar -mx-1 flex flex-col gap-6 overflow-x-hidden overflow-y-auto px-1 pt-6 pb-6 md:pt-0"
        >
          {NAV_GROUPS.map(({ label: groupLabel, items }) => (
            <div key={groupLabel}>
              <h2 className="relative mb-4 h-5 text-xs leading-5 text-muted-foreground uppercase">
                <span className={label}>{groupLabel}</span>
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-y-0 left-0 flex w-12.5 justify-center transition-opacity duration-300',
                    full && 'opacity-0',
                  )}
                >
                  <Ellipsis className="size-4" />
                </span>
              </h2>
              <ul className="flex flex-col gap-1">
                {items.map((item) => {
                  const { label: itemLabel, href, icon: Icon, children } = item;
                  const active = isActive(pathname, href);
                  const content = (
                    <>
                      <Icon className="size-6 shrink-0" />
                      <span className={cn(label, 'truncate')}>{itemLabel}</span>
                    </>
                  );

                  if (!children) {
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          title={full ? undefined : itemLabel}
                          aria-current={active ? 'page' : undefined}
                          className={cn(ITEM, active ? ITEM_ACTIVE : ITEM_IDLE)}
                        >
                          {content}
                        </Link>
                      </li>
                    );
                  }

                  const open = full && openHref === href;
                  return (
                    <li key={href}>
                      <button
                        type="button"
                        title={full ? undefined : itemLabel}
                        aria-expanded={open}
                        onClick={() => setToggled({ path: pathname, href: open ? null : href })}
                        className={cn(ITEM, active ? ITEM_ACTIVE : ITEM_IDLE)}
                      >
                        {content}
                        <ChevronDown
                          className={cn(
                            'ms-auto size-5 shrink-0 transition-[transform,opacity] duration-300',
                            open && 'rotate-180',
                            !full && 'opacity-0',
                          )}
                        />
                      </button>
                      <SubMenu item={item} open={open} pathname={pathname} />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};
