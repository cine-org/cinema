'use client';

import { ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { findCurrent } from './nav-items';

export const Breadcrumb = () => {
  const { item, child } = findCurrent(usePathname());
  if (!item) return null;

  const trail = [item.label, ...(child ? [child.label] : [])];

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        <li>Cinema</li>
        {trail.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <ChevronRight aria-hidden className="size-4" />
            <span className={i === trail.length - 1 ? 'font-medium text-foreground' : undefined}>
              {label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
};
