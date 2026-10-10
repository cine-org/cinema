import { Injectable } from '@nestjs/common';
import { RoomNotFoundException } from '../../domain';
import { RoomReadRepository } from '../port';
import type { RoomView } from '../views';

export class GetRoomQuery {
  constructor(readonly roomId: string) {}
}

@Injectable()
export class GetRoomHandler {
  constructor(private readonly rooms: RoomReadRepository) {}

  async execute(query: GetRoomQuery): Promise<RoomView> {
    const room = await this.rooms.findById(query.roomId);

    if (!room) {
      throw new RoomNotFoundException();
    }

    return room;
  }
}
