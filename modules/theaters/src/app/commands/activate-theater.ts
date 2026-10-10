import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { TheaterNotFoundException } from '../../domain';
import { TheaterWriteRepository } from '../port';

export class ActivateTheaterCommand {
  constructor(readonly theaterId: string) {}
}

@Injectable()
export class ActivateTheaterHandler {
  constructor(private readonly theaters: TheaterWriteRepository) {}

  async execute(command: ActivateTheaterCommand): Promise<CommandResult> {
    const theater = await this.theaters.findById(command.theaterId);

    if (!theater) {
      throw new TheaterNotFoundException();
    }

    theater.activate();
    await this.theaters.update(theater);

    return { id: theater.id };
  }
}
