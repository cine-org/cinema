import { Injectable } from '@nestjs/common';
import { TheaterNotFoundException } from '../../domain';
import { TheaterReadRepository } from '../port';
import type { TheaterView } from '../views';

export class GetTheaterQuery {
  constructor(readonly theaterId: string) {}
}

@Injectable()
export class GetTheaterHandler {
  constructor(private readonly theaters: TheaterReadRepository) {}

  async execute(query: GetTheaterQuery): Promise<TheaterView> {
    const theater = await this.theaters.findById(query.theaterId);

    if (!theater) {
      throw new TheaterNotFoundException();
    }

    return theater;
  }
}
