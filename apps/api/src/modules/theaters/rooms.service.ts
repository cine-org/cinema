import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import {
  ActivateRoomCommand,
  ActivateRoomHandler,
  CloseRoomCommand,
  CloseRoomHandler,
  CreateRoomCommand,
  CreateRoomHandler,
  DeactivateRoomCommand,
  DeactivateRoomHandler,
  DeleteRoomCommand,
  DeleteRoomHandler,
  GetRoomHandler,
  GetRoomQuery,
  ListRoomsHandler,
  ListRoomsQuery,
  UpdateRoomCommand,
  UpdateRoomHandler,
  type CreateRoomCommandProps,
  type ListRoomsQueryProps,
  type RoomView,
  type UpdateRoomCommandProps,
} from '@repo/theaters';

// One entry point for the module's handlers; controllers never touch a handler directly.
@Injectable()
export class RoomsService {
  constructor(
    private readonly createHandler: CreateRoomHandler,
    private readonly updateHandler: UpdateRoomHandler,
    private readonly activateHandler: ActivateRoomHandler,
    private readonly deactivateHandler: DeactivateRoomHandler,
    private readonly closeHandler: CloseRoomHandler,
    private readonly deleteHandler: DeleteRoomHandler,
    private readonly getHandler: GetRoomHandler,
    private readonly listHandler: ListRoomsHandler,
  ) {}

  async create(props: CreateRoomCommandProps): Promise<CommandResult> {
    return this.createHandler.execute(new CreateRoomCommand(props));
  }

  async update(props: UpdateRoomCommandProps): Promise<CommandResult> {
    return this.updateHandler.execute(new UpdateRoomCommand(props));
  }

  async activate(id: string): Promise<CommandResult> {
    return this.activateHandler.execute(new ActivateRoomCommand(id));
  }

  async deactivate(id: string): Promise<CommandResult> {
    return this.deactivateHandler.execute(new DeactivateRoomCommand(id));
  }

  async close(id: string): Promise<CommandResult> {
    return this.closeHandler.execute(new CloseRoomCommand(id));
  }

  async delete(id: string): Promise<CommandResult> {
    return this.deleteHandler.execute(new DeleteRoomCommand(id));
  }

  async findById(id: string): Promise<RoomView> {
    return this.getHandler.execute(new GetRoomQuery(id));
  }

  async list(props: ListRoomsQueryProps): Promise<RoomView[]> {
    return this.listHandler.execute(new ListRoomsQuery(props));
  }
}
