import { Injectable } from '@nestjs/common';
import { RoomLayoutNotFoundException } from '../../domain';
import { RoomLayoutReadRepository } from '../port';
import type { RoomLayoutView } from '../views';

export class GetRoomLayoutDraftQuery {
  constructor(readonly roomId: string) {}
}

@Injectable()
export class GetRoomLayoutDraftHandler {
  constructor(private readonly layouts: RoomLayoutReadRepository) {}

  async execute(query: GetRoomLayoutDraftQuery): Promise<RoomLayoutView> {
    const draft = await this.layouts.findDraft(query.roomId);

    if (!draft) {
      throw new RoomLayoutNotFoundException({ message: 'Room has no layout draft' });
    }

    return draft;
  }
}
