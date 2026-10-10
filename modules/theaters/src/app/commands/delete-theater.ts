import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { TheaterNotFoundException } from '../../domain';
import { TheaterWriteRepository } from '../port';

export class DeleteTheaterCommand {
  constructor(readonly theaterId: string) {}
}

@Injectable()
export class DeleteTheaterHandler {
  constructor(private readonly theaters: TheaterWriteRepository) {}

  async execute(command: DeleteTheaterCommand): Promise<CommandResult> {
    const theater = await this.theaters.findById(command.theaterId);

    if (!theater) {
      throw new TheaterNotFoundException();
    }

    theater.assertDeletable();
    await this.theaters.delete(theater.id);

    return { id: theater.id };
  }
}
