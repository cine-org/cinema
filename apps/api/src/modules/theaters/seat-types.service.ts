import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import {
  CreateSeatTypeCommand,
  CreateSeatTypeHandler,
  DeleteSeatTypeCommand,
  DeleteSeatTypeHandler,
  GetSeatTypeHandler,
  GetSeatTypeQuery,
  ListSeatTypesHandler,
  ListSeatTypesQuery,
  UpdateSeatTypeCommand,
  UpdateSeatTypeHandler,
  type CreateSeatTypeCommandProps,
  type SeatTypeView,
  type UpdateSeatTypeCommandProps,
} from '@repo/theaters';

// One entry point for the module's handlers; controllers never touch a handler directly.
@Injectable()
export class SeatTypesService {
  constructor(
    private readonly createHandler: CreateSeatTypeHandler,
    private readonly updateHandler: UpdateSeatTypeHandler,
    private readonly deleteHandler: DeleteSeatTypeHandler,
    private readonly getHandler: GetSeatTypeHandler,
    private readonly listHandler: ListSeatTypesHandler,
  ) {}

  async create(props: CreateSeatTypeCommandProps): Promise<CommandResult<'code'>> {
    return this.createHandler.execute(new CreateSeatTypeCommand(props));
  }

  async update(props: UpdateSeatTypeCommandProps): Promise<CommandResult<'code'>> {
    return this.updateHandler.execute(new UpdateSeatTypeCommand(props));
  }

  async delete(code: string): Promise<CommandResult<'code'>> {
    return this.deleteHandler.execute(new DeleteSeatTypeCommand(code));
  }

  async findByCode(code: string): Promise<SeatTypeView> {
    return this.getHandler.execute(new GetSeatTypeQuery(code));
  }

  async list(): Promise<SeatTypeView[]> {
    return this.listHandler.execute(new ListSeatTypesQuery());
  }
}
