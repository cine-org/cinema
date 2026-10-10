import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { Theater, type TheaterDetails } from '../../domain';
import { TheaterWriteRepository } from '../port';

export class CreateTheaterCommand {
  constructor(readonly props: TheaterDetails) {}
}

@Injectable()
export class CreateTheaterHandler {
  constructor(private readonly theaters: TheaterWriteRepository) {}

  async execute(command: CreateTheaterCommand): Promise<CommandResult> {
    const theater = Theater.create(command.props);

    await this.theaters.create(theater);

    return { id: theater.id };
  }
}
