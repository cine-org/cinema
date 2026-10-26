'use client';

import { InfoCard, type InfoCardProps } from '@/components/info-card';
import { saveInfo, type InfoEntity } from '../_data/mutations';

type Props = Omit<InfoCardProps, 'noun' | 'onSave'> & { entity: InfoEntity };

// binds the shared card to a cluster, theater or room, since a server page cannot pass the save function down
export const EntityInfoCard = ({ entity, ...props }: Props) => (
  <InfoCard {...props} noun={entity.kind} onSave={(values) => saveInfo(entity, values)} />
);
