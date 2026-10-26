import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { User } from '../_data/user';

export const UserCell = ({ user }: { user: User }) => (
  <div className="flex items-center gap-3">
    <Avatar>
      <AvatarFallback>
        {(user.fullName ?? user.email ?? '?').trim().charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="grid min-w-0 leading-tight">
      <span className={cn('truncate', !user.fullName && 'text-muted-foreground')}>
        {user.fullName ?? 'No name'}
      </span>
      <span className="truncate text-xs text-muted-foreground">{user.email ?? 'No email'}</span>
    </div>
  </div>
);
