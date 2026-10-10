import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { TheaterNotFoundException } from '../../domain';
import { TheaterWriteRepository } from '../port';

export class CloseTheaterCommand {
  constructor(readonly theaterId: string) {}
}

@Injectable()
export class CloseTheaterHandler {
  constructor(private readonly theaters: TheaterWriteRepository) {}

  async execute(command: CloseTheaterCommand): Promise<CommandResult> {
    const theater = await this.theaters.findById(command.theaterId);

    if (!theater) {
      throw new TheaterNotFoundException();
    }

    theater.close();
    await this.theaters.update(theater);

    return { id: theater.id };
  }
}
