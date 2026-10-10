import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { RoomNotFoundException } from '../../domain';
import { RoomWriteRepository } from '../port';

export class DeleteRoomCommand {
  constructor(readonly roomId: string) {}
}

@Injectable()
export class DeleteRoomHandler {
  constructor(private readonly rooms: RoomWriteRepository) {}

  async execute(command: DeleteRoomCommand): Promise<CommandResult> {
    const room = await this.rooms.findById(command.roomId);

    if (!room) {
      throw new RoomNotFoundException();
    }

    room.assertDeletable();
    await this.rooms.delete(room.id);

    return { id: room.id };
  }
}
