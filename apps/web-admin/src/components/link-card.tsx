import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  // null when the viewer has no page to go to; the card is then shown as is
  href: string | null;
  className?: string;
  children: React.ReactNode;
};

export const LinkCard = ({ title, href, className, children }: Props) => {
  const card = (
    <Card className={cn(className, href && 'group-hover:shadow-md group-hover:ring-foreground/25')}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          {title}
          {href && <ChevronRight className="size-5 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className="group block rounded-xl">
      {card}
    </Link>
  ) : (
    card
  );
};
