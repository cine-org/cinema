import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { buildSeatMap, RoomLayout, type RoomLayoutGrid, type SeatCell } from '../../domain';
import {
  RoomLayoutWriteRepository,
  RoomWriteRepository,
  SeatTypeWriteRepository,
  TheaterWriteRepository,
} from '../port';
import { loadRoom } from './load-room';

export type UpsertRoomLayoutDraftCommandProps = {
  readonly roomId: string;
  readonly grid: RoomLayoutGrid;
  readonly seats: readonly SeatCell[];
};

export class UpsertRoomLayoutDraftCommand {
  constructor(readonly props: UpsertRoomLayoutDraftCommandProps) {}
}

@Injectable()
export class UpsertRoomLayoutDraftHandler {
  constructor(
    private readonly rooms: RoomWriteRepository,
    private readonly theaters: TheaterWriteRepository,
    private readonly layouts: RoomLayoutWriteRepository,
    private readonly seatTypes: SeatTypeWriteRepository,
  ) {}

  async execute({ props }: UpsertRoomLayoutDraftCommand): Promise<CommandResult> {
    const { room, theater } = await loadRoom(this.rooms, this.theaters, props.roomId);
    const existing = await this.layouts.findDraft(room.id);

    // A new draft is always the next version, on top of the history.
    const draft =
      existing ??
      RoomLayout.createDraft(
        room,
        theater,
        (await this.layouts.latestVersion(room.id)) + 1,
        props.grid,
      );

    if (existing) {
      room.assertEditable(theater);
      existing.resize(props.grid);
    }

    const codes = [...new Set(props.seats.map((cell) => cell.seatTypeCode.trim().toUpperCase()))];
    const seats = buildSeatMap(draft, props.seats, await this.seatTypes.findByCodes(codes));

    if (existing) {
      await this.layouts.update(draft, seats);
    } else {
      await this.layouts.create(draft, seats);
    }

    return { id: draft.id };
  }
}
