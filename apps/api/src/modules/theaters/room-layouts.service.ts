import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import {
  GetRoomLayoutDraftHandler,
  GetRoomLayoutDraftQuery,
  GetRoomLayoutHandler,
  GetRoomLayoutQuery,
  ListRoomLayoutsHandler,
  ListRoomLayoutsQuery,
  PublishRoomLayoutDraftCommand,
  PublishRoomLayoutDraftHandler,
  UpsertRoomLayoutDraftCommand,
  UpsertRoomLayoutDraftHandler,
  type GetRoomLayoutQueryProps,
  type RoomLayoutSummaryView,
  type RoomLayoutView,
  type UpsertRoomLayoutDraftCommandProps,
} from '@repo/theaters';

// One entry point for the module's handlers; controllers never touch a handler directly.
@Injectable()
export class RoomLayoutsService {
  constructor(
    private readonly upsertDraftHandler: UpsertRoomLayoutDraftHandler,
    private readonly publishDraftHandler: PublishRoomLayoutDraftHandler,
    private readonly getHandler: GetRoomLayoutHandler,
    private readonly getDraftHandler: GetRoomLayoutDraftHandler,
    private readonly listHandler: ListRoomLayoutsHandler,
  ) {}

  async upsertDraft(props: UpsertRoomLayoutDraftCommandProps): Promise<CommandResult> {
    return this.upsertDraftHandler.execute(new UpsertRoomLayoutDraftCommand(props));
  }

  async publishDraft(roomId: string): Promise<CommandResult> {
    return this.publishDraftHandler.execute(new PublishRoomLayoutDraftCommand(roomId));
  }

  async findById(props: GetRoomLayoutQueryProps): Promise<RoomLayoutView> {
    return this.getHandler.execute(new GetRoomLayoutQuery(props));
  }

  async findDraft(roomId: string): Promise<RoomLayoutView> {
    return this.getDraftHandler.execute(new GetRoomLayoutDraftQuery(roomId));
  }

  async list(roomId: string): Promise<RoomLayoutSummaryView[]> {
    return this.listHandler.execute(new ListRoomLayoutsQuery(roomId));
  }
}
