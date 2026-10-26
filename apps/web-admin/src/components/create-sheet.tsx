'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { Result } from '@/lib/result';
import { toastResult } from '@/lib/toast-result';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export type CreateField = { id: string; label: string; hint?: string };

type Props = {
  noun: string;
  // under the title, such as where the new one is created
  description: string;
  fields: CreateField[];
  onCreate: (values: Record<string, string>) => Promise<Result>;
};

export const CreateSheet = ({ noun, description, fields, onCreate }: Props) => {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const create = async () => {
    const result = await onCreate(values);
    if (!toastResult(result, `The ${noun} was created.`)) return;
    setOpen(false);
    setValues({});
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <Plus />
          Add {noun}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add {noun}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4">
          {fields.map(({ id, label, hint }) => (
            <div key={id} className="grid gap-1.5">
              <Label htmlFor={`${noun}-${id}`} className="text-muted-foreground">
                {label}
              </Label>
              <Input
                id={`${noun}-${id}`}
                value={values[id] ?? ''}
                onChange={(e) => setValues({ ...values, [id]: e.target.value })}
              />
              {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </div>
          ))}
        </div>
        <SheetFooter>
          <Button onClick={create}>Create</Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
