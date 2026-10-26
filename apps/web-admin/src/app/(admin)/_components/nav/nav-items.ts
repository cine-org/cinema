import {
  BadgePercent,
  Building2,
  CalendarDays,
  CreditCard,
  Film,
  LayoutDashboard,
  LifeBuoy,
  Popcorn,
  RotateCcw,
  ScrollText,
  Settings,
  ShieldCheck,
  Star,
  Tags,
  Ticket,
  User,
  type LucideIcon,
} from 'lucide-react';

export type NavChild = { label: string; href: string };

// an item with children is a section: its own href only anchors the active match
export type NavItem = { label: string; href: string; icon: LucideIcon; children?: NavChild[] };

export type NavGroup = { label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Bookings', href: '/bookings', icon: Ticket },
      { label: 'Refunds', href: '/refunds', icon: RotateCcw },
      { label: 'Payments', href: '/payments', icon: CreditCard },
      { label: 'Promotions', href: '/promotions', icon: BadgePercent },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'Tickets', href: '/support-tickets', icon: LifeBuoy },
      { label: 'Reviews', href: '/reviews', icon: Star },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Movies', href: '/movies', icon: Film },
      { label: 'Theaters', href: '/theaters', icon: Building2 },
      { label: 'Showtimes', href: '/showtimes', icon: CalendarDays },
      { label: 'Pricing', href: '/pricing', icon: Tags },
      { label: 'Concessions', href: '/concessions', icon: Popcorn },
    ],
  },
  {
    label: 'System',
    items: [
      {
        label: 'Users',
        href: '/users',
        icon: User,
        children: [
          { label: 'Customers', href: '/users/customers' },
          { label: 'Employees', href: '/users/employees' },
        ],
      },
      { label: 'IAM', href: '/iam', icon: ShieldCheck },
      { label: 'Audit log', href: '/audit-log', icon: ScrollText },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

// '/' matches only itself; other items also match their sub-routes ('/users/123')
export const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

export const findCurrent = (pathname: string) => {
  const item = NAV_ITEMS.find((i) => isActive(pathname, i.href));
  const child = item?.children?.find((c) => isActive(pathname, c.href));
  return { item, child };
};
