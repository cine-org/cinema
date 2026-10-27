import { Injectable } from '@nestjs/common';
import { DatabaseWriteClient } from '@repo/database';
import type { PermissionTarget } from '@/common/surface';

export type LocatedTheater = { readonly id: string; readonly clusterId: string | null };

const THEATER = { id: true, clusterId: true } as const;

// Finds the theater a route acts on, and its cluster, for scoped permission checks. Reads the
// primary, like the session check. Null when the id is unknown: the caller is then refused,
// without telling whether the record exists in another theater.
@Injectable()
export class TheaterLocator {
  constructor(private readonly db: DatabaseWriteClient) {}

  async locate(
    target: Exclude<PermissionTarget, 'any-scope' | 'list'>,
    params: Record<string, string | undefined>,
  ): Promise<LocatedTheater | null> {
    if ('theater' in target) {
      const id = params[target.theater];
      if (!id) return null;
      return this.db.theater.findUnique({ where: { id }, select: THEATER });
    }

    if ('theaterSlug' in target) {
      const slug = params[target.theaterSlug];
      if (!slug) return null;
      return this.db.theater.findUnique({ where: { slug }, select: THEATER });
    }

    if ('room' in target) {
      const id = params[target.room];
      if (!id) return null;
      const room = await this.db.room.findUnique({
        where: { id },
        select: { theater: { select: THEATER } },
      });
      return room?.theater ?? null;
    }

    const id = params[target.seat];
    if (!id) return null;
    const seat = await this.db.seat.findUnique({
      where: { id },
      select: { layout: { select: { room: { select: { theater: { select: THEATER } } } } } },
    });
    return seat?.layout.room.theater ?? null;
  }
}
