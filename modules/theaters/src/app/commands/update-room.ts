import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import type { RoomDetails } from '../../domain';
import { RoomWriteRepository, TheaterWriteRepository } from '../port';
import { loadRoom } from './load-room';

export type UpdateRoomCommandProps = {
  readonly roomId: string;
  readonly details: Partial<RoomDetails>;
};

export class UpdateRoomCommand {
  constructor(readonly props: UpdateRoomCommandProps) {}
}

@Injectable()
export class UpdateRoomHandler {
  constructor(
    private readonly rooms: RoomWriteRepository,
    private readonly theaters: TheaterWriteRepository,
  ) {}

  async execute({ props }: UpdateRoomCommand): Promise<CommandResult> {
    const { room, theater } = await loadRoom(this.rooms, this.theaters, props.roomId);

    room.update(theater, props.details);
    await this.rooms.update(room);

    return { id: room.id };
  }
}
