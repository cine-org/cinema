import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { Room, TheaterNotFoundException, type RoomDetails } from '../../domain';
import { RoomWriteRepository, TheaterWriteRepository } from '../port';

export type CreateRoomCommandProps = {
  readonly theaterId: string;
  readonly details: RoomDetails;
};

export class CreateRoomCommand {
  constructor(readonly props: CreateRoomCommandProps) {}
}

@Injectable()
export class CreateRoomHandler {
  constructor(
    private readonly rooms: RoomWriteRepository,
    private readonly theaters: TheaterWriteRepository,
  ) {}

  async execute({ props }: CreateRoomCommand): Promise<CommandResult> {
    const theater = await this.theaters.findById(props.theaterId);

    if (!theater) {
      throw new TheaterNotFoundException();
    }

    const room = Room.create(theater, props.details);
    await this.rooms.create(room);

    return { id: room.id };
  }
}
