import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { RoomWriteRepository, TheaterWriteRepository } from '../port';
import { loadRoom } from './load-room';

export class CloseRoomCommand {
  constructor(readonly roomId: string) {}
}

@Injectable()
export class CloseRoomHandler {
  constructor(
    private readonly rooms: RoomWriteRepository,
    private readonly theaters: TheaterWriteRepository,
  ) {}

  async execute(command: CloseRoomCommand): Promise<CommandResult> {
    const { room, theater } = await loadRoom(this.rooms, this.theaters, command.roomId);

    room.close(theater);
    await this.rooms.update(room);

    return { id: room.id };
  }
}
