import { Injectable } from '@nestjs/common';
import { TheaterNotFoundException } from '../../domain';
import { TheaterReadRepository } from '../port';
import type { TheaterView } from '../views';

export class GetTheaterBySlugQuery {
  constructor(readonly slug: string) {}
}

@Injectable()
export class GetTheaterBySlugHandler {
  constructor(private readonly theaters: TheaterReadRepository) {}

  async execute(query: GetTheaterBySlugQuery): Promise<TheaterView> {
    const theater = await this.theaters.findBySlug(query.slug);

    if (!theater) {
      throw new TheaterNotFoundException();
    }

    return theater;
  }
}
