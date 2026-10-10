import { Injectable } from '@nestjs/common';
import { TheaterNotFoundException, type RoomStatus } from '../../domain';
import { RoomReadRepository, TheaterReadRepository } from '../port';
import type { RoomView } from '../views';

export type ListRoomsQueryProps = {
  readonly theaterId: string;
  readonly status?: RoomStatus;
};

export class ListRoomsQuery {
  constructor(readonly props: ListRoomsQueryProps) {}
}

@Injectable()
export class ListRoomsHandler {
  constructor(
    private readonly rooms: RoomReadRepository,
    private readonly theaters: TheaterReadRepository,
  ) {}

  // 404 for an unknown theater instead of an empty list.
  async execute({ props }: ListRoomsQuery): Promise<RoomView[]> {
    if (!(await this.theaters.findById(props.theaterId))) {
      throw new TheaterNotFoundException();
    }

    return this.rooms.listByTheater(props.theaterId, props.status);
  }
}
