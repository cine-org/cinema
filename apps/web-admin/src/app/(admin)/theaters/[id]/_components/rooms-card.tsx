import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Room } from '../../_data/types';
import { TheaterStatusBadge } from '../../_components/theater-status-badge';
import { CreateChildSheet } from '../../_components/create-child-sheet';

const ROOM_FIELDS = [
  { id: 'code', label: 'Code', hint: 'Can only be changed while the room is a draft.' },
  { id: 'name', label: 'Name' },
];

const layoutText = ({ published, draft }: Room['layout']) =>
  [published ? `v${published} published` : 'No layout', draft ? `draft v${draft}` : null]
    .filter(Boolean)
    .join(', ');

type Props = { theaterId: string; theaterName: string; rooms: Room[]; canCreate: boolean };

export const RoomsCard = ({ theaterId, theaterName, rooms, canCreate }: Props) => {
  const capacity = rooms.reduce((n, r) => n + r.capacity, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rooms</CardTitle>
        <div className="text-sm text-muted-foreground">
          {rooms.length} rooms, capacity {capacity.toLocaleString('en-US')}
        </div>
        {canCreate && (
          <CardAction>
            <CreateChildSheet
              noun="room"
              parent={{ id: theaterId, name: theaterName }}
              fields={ROOM_FIELDS}
            />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="px-0">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[34%] pl-6">Room</TableHead>
              <TableHead className="w-[16%]">Status</TableHead>
              <TableHead className="w-[14%]">Capacity</TableHead>
              <TableHead className="w-[28%]">Layout</TableHead>
              <TableHead className="w-[8%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((r) => (
              <TableRow key={r.id} className="h-14">
                <TableCell className="pl-6">
                  <div className="grid min-w-0 leading-tight">
                    <span className="truncate">{r.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {r.code}
                      {r.inactiveSeats > 0 && `, ${r.inactiveSeats} inactive seats`}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <TheaterStatusBadge status={r.status} />
                </TableCell>
                <TableCell className="tabular-nums">{r.capacity}</TableCell>
                <TableCell className="truncate text-muted-foreground">
                  {layoutText(r.layout)}
                </TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="icon-sm">
                    <Link
                      href={`/theaters/${theaterId}/rooms/${r.id}`}
                      aria-label={`Open ${r.name}`}
                    >
                      <ChevronRight />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rooms.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No rooms yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
