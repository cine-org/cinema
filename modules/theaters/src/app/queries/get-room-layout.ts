import { Injectable } from '@nestjs/common';
import { RoomLayoutNotFoundException } from '../../domain';
import { RoomLayoutReadRepository } from '../port';
import type { RoomLayoutView } from '../views';

export type GetRoomLayoutQueryProps = {
  readonly roomId: string;
  readonly layoutId: string;
};

export class GetRoomLayoutQuery {
  constructor(readonly props: GetRoomLayoutQueryProps) {}
}

@Injectable()
export class GetRoomLayoutHandler {
  constructor(private readonly layouts: RoomLayoutReadRepository) {}

  async execute({ props }: GetRoomLayoutQuery): Promise<RoomLayoutView> {
    const layout = await this.layouts.findById(props.roomId, props.layoutId);

    if (!layout) {
      throw new RoomLayoutNotFoundException();
    }

    return layout;
  }
}
