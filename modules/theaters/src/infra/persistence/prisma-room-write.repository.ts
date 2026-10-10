import { Injectable } from '@nestjs/common';
import {
  DatabaseWriteClient,
  PRISMA_ERROR_CODE,
  throwIfPrismaError,
  type Prisma,
} from '@repo/database';
import type { RoomWriteRepository } from '../../app';
import {
  Room,
  RoomCodeTakenException,
  RoomInUseException,
  RoomNotFoundException,
  TheaterNotFoundException,
} from '../../domain';

@Injectable()
export class PrismaRoomWriteRepository implements RoomWriteRepository {
  constructor(private readonly db: DatabaseWriteClient) {}

  async findById(id: string): Promise<Room | null> {
    const row = await this.db.room.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async create(room: Room): Promise<void> {
    try {
      await this.db.room.create({ data: toPrisma(room) });
    } catch (error) {
      this.throwKnown(error);
    }
  }

  // Fails instead of re-inserting when the row was deleted in the meantime.
  async update(room: Room): Promise<void> {
    const { id, theaterId: _theaterId, ...data } = toPrisma(room);

    try {
      await this.db.room.update({ where: { id }, data });
    } catch (error) {
      this.throwKnown(error);
    }
  }

  // Only draft rooms are deleted, so their layouts were never sold; the FK still guards the rest.
  async delete(id: string): Promise<void> {
    try {
      await this.db.$transaction([
        this.db.roomLayout.deleteMany({ where: { roomId: id } }),
        this.db.room.delete({ where: { id } }),
      ]);
    } catch (error) {
      throwIfPrismaError(error, {
        [PRISMA_ERROR_CODE.FOREIGN_KEY_CONSTRAINT_FAILED]: () =>
          new RoomInUseException({ cause: error }),
        [PRISMA_ERROR_CODE.RECORD_REQUIRED_BUT_NOT_FOUND]: () =>
          new RoomNotFoundException({ cause: error }),
      });

      throw error;
    }
  }

  private throwKnown(error: unknown): never {
    throwIfPrismaError(error, {
      // (theater_id, code) is the only unique besides the id.
      [PRISMA_ERROR_CODE.UNIQUE_CONSTRAINT_FAILED]: () =>
        new RoomCodeTakenException({ cause: error }),
      [PRISMA_ERROR_CODE.FOREIGN_KEY_CONSTRAINT_FAILED]: () =>
        new TheaterNotFoundException({ cause: error }),
      [PRISMA_ERROR_CODE.RECORD_REQUIRED_BUT_NOT_FOUND]: () =>
        new RoomNotFoundException({ cause: error }),
    });

    throw error;
  }
}

function toEntity(row: Prisma.RoomModel): Room {
  return Room.restore({
    id: row.id,
    theaterId: row.theaterId,
    code: row.code,
    name: row.name,
    status: row.status,
  });
}

function toPrisma(room: Room): Prisma.RoomUncheckedCreateInput {
  return {
    id: room.id,
    theaterId: room.theaterId,
    code: room.code,
    name: room.name,
    status: room.status,
  };
}
