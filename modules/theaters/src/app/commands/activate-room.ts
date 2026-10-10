import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { RoomLayoutWriteRepository, RoomWriteRepository, TheaterWriteRepository } from '../port';
import { loadRoom } from './load-room';

export class ActivateRoomCommand {
  constructor(readonly roomId: string) {}
}

@Injectable()
export class ActivateRoomHandler {
  constructor(
    private readonly rooms: RoomWriteRepository,
    private readonly theaters: TheaterWriteRepository,
    private readonly layouts: RoomLayoutWriteRepository,
  ) {}

  async execute(command: ActivateRoomCommand): Promise<CommandResult> {
    const { room, theater } = await loadRoom(this.rooms, this.theaters, command.roomId);

    room.activate(theater, await this.layouts.findPublished(room.id));
    await this.rooms.update(room);

    return { id: room.id };
  }
}
