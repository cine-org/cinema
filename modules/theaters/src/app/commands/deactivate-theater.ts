import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { TheaterNotFoundException } from '../../domain';
import { TheaterWriteRepository } from '../port';

export class DeactivateTheaterCommand {
  constructor(readonly theaterId: string) {}
}

@Injectable()
export class DeactivateTheaterHandler {
  constructor(private readonly theaters: TheaterWriteRepository) {}

  async execute(command: DeactivateTheaterCommand): Promise<CommandResult> {
    const theater = await this.theaters.findById(command.theaterId);

    if (!theater) {
      throw new TheaterNotFoundException();
    }

    theater.deactivate();
    await this.theaters.update(theater);

    return { id: theater.id };
  }
}
