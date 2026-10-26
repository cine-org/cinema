import { Clapperboard } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type Props = { src: string | null; alt: string; sizes: string; className?: string };

// fills its parent, which must be positioned and sized
export const CoverImage = ({ src, alt, sizes, className }: Props) =>
  src ? (
    <Image src={src} alt={alt} fill sizes={sizes} className={cn('object-cover', className)} />
  ) : (
    <div
      className={cn(
        'absolute inset-0 grid place-items-center bg-gradient-to-br from-zinc-700 to-zinc-900',
        className,
      )}
    >
      <Clapperboard className="size-10 text-white/30" />
    </div>
  );
