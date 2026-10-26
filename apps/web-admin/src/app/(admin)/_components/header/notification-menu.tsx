'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BellIcon } from './header-icons';
import { HEADER_ICON_BUTTON } from './header-styles';

// TODO: list real notifications once the api has them
export const NotificationMenu = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="outline"
        size="icon"
        aria-label="Notifications"
        className={HEADER_ICON_BUTTON}
      >
        <BellIcon />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-80">
      <DropdownMenuLabel className="text-sm font-medium text-foreground">
        Notifications
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <p className="px-2 py-6 text-center text-sm text-muted-foreground">No new notifications</p>
    </DropdownMenuContent>
  </DropdownMenu>
);
