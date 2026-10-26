'use client';

import { ChevronDown, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CURRENT_USER } from '../../_data/mock-session';
import { useSignOut } from './use-sign-out';

export const UserMenu = () => {
  const signOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="User menu"
          className="group flex items-center gap-3 rounded-lg p-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar size="lg">
            <AvatarFallback>{CURRENT_USER.initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{CURRENT_USER.name}</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="grid text-sm leading-tight">
          <span className="font-medium text-foreground">{CURRENT_USER.name}</span>
          <span className="text-xs font-normal text-muted-foreground">{CURRENT_USER.role}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
