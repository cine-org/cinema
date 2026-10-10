import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import {
  RoomLayoutWriteRepository,
  RoomWriteRepository,
  SeatWriteRepository,
  TheaterWriteRepository,
} from '../port';
import { loadServiceableSeat } from './load-seat';

export class DeactivateSeatCommand {
  constructor(readonly seatId: string) {}
}

@Injectable()
export class DeactivateSeatHandler {
  constructor(
    private readonly seats: SeatWriteRepository,
    private readonly layouts: RoomLayoutWriteRepository,
    private readonly rooms: RoomWriteRepository,
    private readonly theaters: TheaterWriteRepository,
  ) {}

  async execute(command: DeactivateSeatCommand): Promise<CommandResult> {
    const { seats, layouts, rooms, theaters } = this;
    const seat = await loadServiceableSeat({ seats, layouts, rooms, theaters }, command.seatId);

    seat.deactivate();
    await this.seats.update(seat);

    return { id: seat.id };
  }
}
