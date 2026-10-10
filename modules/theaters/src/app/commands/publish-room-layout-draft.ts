import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { RoomLayoutNotFoundException } from '../../domain';
import { RoomLayoutWriteRepository, RoomWriteRepository, TheaterWriteRepository } from '../port';
import { loadRoom } from './load-room';

export class PublishRoomLayoutDraftCommand {
  constructor(readonly roomId: string) {}
}

@Injectable()
export class PublishRoomLayoutDraftHandler {
  constructor(
    private readonly rooms: RoomWriteRepository,
    private readonly theaters: TheaterWriteRepository,
    private readonly layouts: RoomLayoutWriteRepository,
  ) {}

  async execute(command: PublishRoomLayoutDraftCommand): Promise<CommandResult> {
    const { room, theater } = await loadRoom(this.rooms, this.theaters, command.roomId);
    room.assertEditable(theater);

    const draft = await this.layouts.findDraft(room.id);

    if (!draft) {
      throw new RoomLayoutNotFoundException({ message: 'Room has no layout draft' });
    }

    const previous = await this.layouts.findPublished(room.id);

    draft.publish(await this.layouts.countSeats(draft.id));
    previous?.retire();

    // Retire first: one PUBLISHED per room is a unique index, checked row by row.
    await this.layouts.updateMany(previous ? [previous, draft] : [draft]);

    return { id: draft.id };
  }
}
