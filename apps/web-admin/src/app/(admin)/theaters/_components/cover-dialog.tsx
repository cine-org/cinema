'use client';

import { ImageDialog } from '@/components/image-dialog';
import { saveCoverImage } from '../_data/mutations';

type Props = { theaterId: string; theaterName: string; current: string | null };

// binds the shared dialog to the theater, since a server page cannot pass the save function down
export const CoverDialog = ({ theaterId, theaterName, current }: Props) => (
  <ImageDialog
    title="Cover image"
    noun="cover image"
    description={`Shown at the top of ${theaterName} and on its card. A 16:9 JPG, PNG or WebP works best.`}
    current={current}
    onSave={(file) => saveCoverImage(theaterId, file)}
  />
);
