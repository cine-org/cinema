'use client';

import { ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
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
import type { Catalog, CatalogRow } from '../../_data/types';
import { CatalogSheet } from './catalog-sheet';

type Props = {
  catalog: Catalog;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

// the row being edited, "new" for the add form, or nothing
type Open = CatalogRow | 'new' | null;

export const CatalogCard = ({ catalog, canCreate, canUpdate, canDelete }: Props) => {
  const { id, title, note, noun, columns, rows } = catalog;
  const [open, setOpen] = useState<Open>(null);
  const canOpen = canUpdate || canDelete;

  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="text-sm text-muted-foreground">{note}</div>
        {canCreate && (
          <CardAction>
            <Button size="sm" onClick={() => setOpen('new')}>
              <Plus />
              Add {noun}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Code</TableHead>
              {columns.map((c) => (
                <TableHead key={c.id}>{c.label}</TableHead>
              ))}
              <TableHead className="w-14" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.code} className="h-12">
                <TableCell className="pl-6 font-mono text-xs">{r.code}</TableCell>
                {columns.map((c) => (
                  <TableCell key={c.id} className="text-muted-foreground first:text-foreground">
                    {r.values[c.id]}
                  </TableCell>
                ))}
                <TableCell>
                  {canOpen && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Open ${r.values.name}`}
                      onClick={() => setOpen(r)}
                    >
                      <ChevronRight />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CatalogSheet
        open={open !== null}
        catalog={catalog}
        row={open && open !== 'new' ? open : null}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onClose={() => setOpen(null)}
      />
    </Card>
  );
};
