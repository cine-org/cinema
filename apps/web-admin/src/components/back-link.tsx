import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export const BackLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className="-ml-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
  >
    <ChevronLeft className="size-4" />
    {children}
  </Link>
);
