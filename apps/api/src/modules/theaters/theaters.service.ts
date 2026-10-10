import { Injectable } from '@nestjs/common';
import type { CommandResult, Page } from '@repo/common';
import {
  ActivateTheaterCommand,
  ActivateTheaterHandler,
  CloseTheaterCommand,
  CloseTheaterHandler,
  CreateTheaterCommand,
  CreateTheaterHandler,
  DeactivateTheaterCommand,
  DeactivateTheaterHandler,
  DeleteTheaterCommand,
  DeleteTheaterHandler,
  GetTheaterBySlugHandler,
  GetTheaterBySlugQuery,
  GetTheaterHandler,
  GetTheaterQuery,
  ListTheatersHandler,
  ListTheatersQuery,
  THEATER_STATUS,
  TheaterNotFoundException,
  UpdateTheaterCommand,
  UpdateTheaterHandler,
  type ListTheatersQueryProps,
  type TheaterDetails,
  type TheaterView,
  type UpdateTheaterCommandProps,
} from '@repo/theaters';

// One entry point for the module's handlers; controllers never touch a handler directly.
@Injectable()
export class TheatersService {
  constructor(
    private readonly createHandler: CreateTheaterHandler,
    private readonly updateHandler: UpdateTheaterHandler,
    private readonly activateHandler: ActivateTheaterHandler,
    private readonly deactivateHandler: DeactivateTheaterHandler,
    private readonly closeHandler: CloseTheaterHandler,
    private readonly deleteHandler: DeleteTheaterHandler,
    private readonly getHandler: GetTheaterHandler,
    private readonly getBySlugHandler: GetTheaterBySlugHandler,
    private readonly listHandler: ListTheatersHandler,
  ) {}

  async create(props: TheaterDetails): Promise<CommandResult> {
    return this.createHandler.execute(new CreateTheaterCommand(props));
  }

  async update(props: UpdateTheaterCommandProps): Promise<CommandResult> {
    return this.updateHandler.execute(new UpdateTheaterCommand(props));
  }

  async activate(id: string): Promise<CommandResult> {
    return this.activateHandler.execute(new ActivateTheaterCommand(id));
  }

  async deactivate(id: string): Promise<CommandResult> {
    return this.deactivateHandler.execute(new DeactivateTheaterCommand(id));
  }

  async close(id: string): Promise<CommandResult> {
    return this.closeHandler.execute(new CloseTheaterCommand(id));
  }

  async delete(id: string): Promise<CommandResult> {
    return this.deleteHandler.execute(new DeleteTheaterCommand(id));
  }

  async findById(id: string): Promise<TheaterView> {
    return this.getHandler.execute(new GetTheaterQuery(id));
  }

  async findBySlug(slug: string): Promise<TheaterView> {
    return this.getBySlugHandler.execute(new GetTheaterBySlugQuery(slug));
  }

  // Customers never learn that a draft or closed theater exists.
  async findOpenBySlug(slug: string): Promise<TheaterView> {
    const theater = await this.findBySlug(slug);

    if (theater.status !== THEATER_STATUS.ACTIVE) {
      throw new TheaterNotFoundException();
    }

    return theater;
  }

  async list(props: ListTheatersQueryProps): Promise<Page<TheaterView>> {
    return this.listHandler.execute(new ListTheatersQuery(props));
  }
}
