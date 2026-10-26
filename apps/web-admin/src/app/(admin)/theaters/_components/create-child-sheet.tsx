'use client';

import { CreateSheet, type CreateField } from '@/components/create-sheet';
import { createChild } from '../_data/mutations';

type Props = {
  noun: 'theater' | 'room';
  // the cluster or theater the new one is created in
  parent: { id: string; name: string };
  fields: CreateField[];
};

export const CreateChildSheet = ({ noun, parent, fields }: Props) => (
  <CreateSheet
    noun={noun}
    description={`Created as a draft in ${parent.name}.`}
    fields={fields}
    onCreate={(values) => createChild(noun, parent.id, values)}
  />
);
