import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import {
  ActivateSeatCommand,
  ActivateSeatHandler,
  DeactivateSeatCommand,
  DeactivateSeatHandler,
} from '@repo/theaters';

// One entry point for the module's handlers; controllers never touch a handler directly.
@Injectable()
export class SeatsService {
  constructor(
    private readonly activateHandler: ActivateSeatHandler,
    private readonly deactivateHandler: DeactivateSeatHandler,
  ) {}

  async activate(id: string): Promise<CommandResult> {
    return this.activateHandler.execute(new ActivateSeatCommand(id));
  }

  async deactivate(id: string): Promise<CommandResult> {
    return this.deactivateHandler.execute(new DeactivateSeatCommand(id));
  }
}
