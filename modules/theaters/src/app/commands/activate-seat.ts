import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import {
  RoomLayoutWriteRepository,
  RoomWriteRepository,
  SeatWriteRepository,
  TheaterWriteRepository,
} from '../port';
import { loadServiceableSeat } from './load-seat';

export class ActivateSeatCommand {
  constructor(readonly seatId: string) {}
}

@Injectable()
export class ActivateSeatHandler {
  constructor(
    private readonly seats: SeatWriteRepository,
    private readonly layouts: RoomLayoutWriteRepository,
    private readonly rooms: RoomWriteRepository,
    private readonly theaters: TheaterWriteRepository,
  ) {}

  async execute(command: ActivateSeatCommand): Promise<CommandResult> {
    const { seats, layouts, rooms, theaters } = this;
    const seat = await loadServiceableSeat({ seats, layouts, rooms, theaters }, command.seatId);

    seat.activate();
    await this.seats.update(seat);

    return { id: seat.id };
  }
}
