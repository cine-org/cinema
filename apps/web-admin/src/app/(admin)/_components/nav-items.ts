import {
  Building2,
  CalendarDays,
  Film,
  LayoutDashboard,
  ShieldCheck,
  Ticket,
  User,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = { label: string; href: string; icon: LucideIcon };

export type NavGroup = { label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'Showtimes', href: '/showtimes', icon: CalendarDays },
      { label: 'Bookings', href: '/bookings', icon: Ticket },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Movies', href: '/movies', icon: Film },
      { label: 'Theaters', href: '/theaters', icon: Building2 },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Users', href: '/users', icon: User },
      { label: 'IAM', href: '/iam', icon: ShieldCheck },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

// '/' matches only itself; other items also match their sub-routes ('/users/123')
export const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
