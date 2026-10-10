import { Injectable } from '@nestjs/common';
import { RoomNotFoundException } from '../../domain';
import { RoomLayoutReadRepository, RoomReadRepository } from '../port';
import type { RoomLayoutSummaryView } from '../views';

export class ListRoomLayoutsQuery {
  constructor(readonly roomId: string) {}
}

@Injectable()
export class ListRoomLayoutsHandler {
  constructor(
    private readonly layouts: RoomLayoutReadRepository,
    private readonly rooms: RoomReadRepository,
  ) {}

  // 404 for an unknown room instead of an empty list.
  async execute(query: ListRoomLayoutsQuery): Promise<RoomLayoutSummaryView[]> {
    if (!(await this.rooms.findById(query.roomId))) {
      throw new RoomNotFoundException();
    }

    return this.layouts.listByRoom(query.roomId);
  }
}
