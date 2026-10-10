import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { TheaterNotFoundException, type TheaterDetails } from '../../domain';
import { TheaterWriteRepository } from '../port';

export type UpdateTheaterCommandProps = {
  readonly theaterId: string;
  readonly details: Partial<TheaterDetails>;
};

export class UpdateTheaterCommand {
  constructor(readonly props: UpdateTheaterCommandProps) {}
}

@Injectable()
export class UpdateTheaterHandler {
  constructor(private readonly theaters: TheaterWriteRepository) {}

  async execute({ props }: UpdateTheaterCommand): Promise<CommandResult> {
    const theater = await this.theaters.findById(props.theaterId);

    if (!theater) {
      throw new TheaterNotFoundException();
    }

    theater.update(props.details);
    await this.theaters.update(theater);

    return { id: theater.id };
  }
}
