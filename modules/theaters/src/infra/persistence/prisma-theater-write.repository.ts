import { Injectable } from '@nestjs/common';
import { PhoneNumber, Slug } from '@repo/common';
import {
  DatabaseWriteClient,
  PRISMA_ERROR_CODE,
  throwIfPrismaError,
  type Prisma,
} from '@repo/database';
import type { TheaterWriteRepository } from '../../app';
import {
  Theater,
  TheaterInUseException,
  TheaterNotFoundException,
  TheaterSlugTakenException,
} from '../../domain';

@Injectable()
export class PrismaTheaterWriteRepository implements TheaterWriteRepository {
  constructor(private readonly db: DatabaseWriteClient) {}

  async findById(id: string): Promise<Theater | null> {
    const row = await this.db.theater.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async create(theater: Theater): Promise<void> {
    try {
      await this.db.theater.create({ data: toPrisma(theater) });
    } catch (error) {
      this.throwKnown(error);
    }
  }

  // Fails instead of re-inserting when the row was deleted in the meantime.
  async update(theater: Theater): Promise<void> {
    const { id, ...data } = toPrisma(theater);

    try {
      await this.db.theater.update({ where: { id }, data });
    } catch (error) {
      this.throwKnown(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.theater.delete({ where: { id } });
    } catch (error) {
      throwIfPrismaError(error, {
        [PRISMA_ERROR_CODE.FOREIGN_KEY_CONSTRAINT_FAILED]: () =>
          new TheaterInUseException({ cause: error }),
        [PRISMA_ERROR_CODE.RECORD_REQUIRED_BUT_NOT_FOUND]: () =>
          new TheaterNotFoundException({ cause: error }),
      });

      throw error;
    }
  }

  private throwKnown(error: unknown): never {
    // The slug is the only unique column besides the id.
    throwIfPrismaError(error, {
      [PRISMA_ERROR_CODE.UNIQUE_CONSTRAINT_FAILED]: () =>
        new TheaterSlugTakenException({ cause: error }),
      [PRISMA_ERROR_CODE.RECORD_REQUIRED_BUT_NOT_FOUND]: () =>
        new TheaterNotFoundException({ cause: error }),
    });

    throw error;
  }
}

function toEntity(row: Prisma.TheaterModel): Theater {
  return Theater.restore({
    id: row.id,
    name: row.name,
    slug: Slug.create(row.slug),
    streetAddress: row.streetAddress,
    ward: row.ward,
    province: row.province,
    phoneNumber: row.phoneNumber ? PhoneNumber.create(row.phoneNumber) : null,
    status: row.status,
  });
}

function toPrisma(theater: Theater): Prisma.TheaterCreateInput {
  return {
    id: theater.id,
    name: theater.name,
    slug: theater.slug.value,
    streetAddress: theater.streetAddress,
    ward: theater.ward,
    province: theater.province,
    phoneNumber: theater.phoneNumber?.value ?? null,
    status: theater.status,
  };
}
