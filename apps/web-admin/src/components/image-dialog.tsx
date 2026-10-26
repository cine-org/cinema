'use client';

import { ImageUp, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Result } from '@/lib/result';
import { toastResult } from '@/lib/toast-result';
import { cn } from '@/lib/utils';
import { CoverImage } from './cover-image';

type Props = {
  title: string;
  // how the toasts name the image
  noun?: string;
  description: string;
  current: string | null;
  // the preview box keeps the shape the image is shown in
  aspect?: 'video' | 'poster';
  triggerLabel?: string;
  // a null file removes the image
  onSave: (file: File | null) => Promise<Result>;
};

export const ImageDialog = ({
  title,
  noun = 'image',
  description,
  current,
  aspect = 'video',
  triggerLabel = 'Change image',
  onSave,
}: Props) => {
  const [open, setOpen] = useState(false);
  // undefined keeps the current image, null removes it
  const [next, setNext] = useState<File | null | undefined>(undefined);
  const input = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (next ? URL.createObjectURL(next) : null), [next]);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const shown = next === undefined ? current : preview;

  const onOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) setNext(undefined);
  };

  const save = async () => {
    if (next === undefined) return;
    const result = await onSave(next);
    if (toastResult(result, `The ${noun} was ${next ? 'changed' : 'removed'}.`))
      onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="bg-background/80 backdrop-blur">
          <ImageUp />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div
          className={cn(
            'relative overflow-hidden rounded-lg ring-1 ring-border',
            aspect === 'video' ? 'aspect-video' : 'mx-auto aspect-[2/3] w-48',
          )}
        >
          <CoverImage src={shown} alt="" sizes="512px" />
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setNext(file);
            e.target.value = '';
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
            <ImageUp />
            Choose file
          </Button>
          {shown && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => setNext(null)}
            >
              <Trash2 />
              Remove
            </Button>
          )}
          {next && (
            <span className="flex min-w-0 items-center text-sm text-muted-foreground">
              <span className="truncate">{next.name}</span>
            </span>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={next === undefined} onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
