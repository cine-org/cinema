'use client';

import { createContext, useContext, useMemo } from 'react';
import type { SeatType } from '../_data/types';

// the seat type catalog comes from the api; the room page loads it once and shares it with
// everything that draws or measures a seat
const SeatTypesContext = createContext<SeatType[] | null>(null);

export const SeatTypesProvider = ({
  types,
  children,
}: {
  types: SeatType[];
  children: React.ReactNode;
}) => <SeatTypesContext.Provider value={types}>{children}</SeatTypesContext.Provider>;

// a seat whose type is no longer in the catalog still takes one cell
const UNKNOWN: Omit<SeatType, 'code'> = { name: 'Unknown', width: 1, maxOccupancy: 1 };

export const useSeatTypes = () => {
  const types = useContext(SeatTypesContext);
  if (!types) throw new Error('useSeatTypes needs a SeatTypesProvider');
  return useMemo(
    () => ({
      types,
      of: (code: string): SeatType => types.find((t) => t.code === code) ?? { code, ...UNKNOWN },
    }),
    [types],
  );
};
