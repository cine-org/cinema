import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = React.ComponentProps<typeof Input> & { wrapperClassName?: string };

export const SearchInput = ({ wrapperClassName, className, ...props }: Props) => (
  <div className={cn('relative', wrapperClassName)}>
    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      className={cn(
        'h-10 border-border bg-transparent pl-9 text-sm shadow-xs placeholder:text-muted-foreground/60 focus-visible:ring-ring/10 md:text-sm dark:border-border dark:bg-white/3',
        className,
      )}
      {...props}
    />
  </div>
);
