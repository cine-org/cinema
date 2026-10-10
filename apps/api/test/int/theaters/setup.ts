import { Test, type TestingModule } from '@nestjs/testing';
import { DatabaseModule, DatabaseWriteClient } from '@repo/database';
import {
  buildSeatMap,
  Room,
  RoomLayout,
  RoomLayoutWriteRepository,
  RoomWriteRepository,
  SeatTypeWriteRepository,
  Theater,
  TheatersModule,
  TheaterWriteRepository,
  type SeatCell,
} from '@repo/theaters';
import { ConfigModule, ConfigService } from '@/config';

const suffix = () => crypto.randomUUID().slice(0, 8);

// Real repositories against the test database, without the HTTP layer; every row created here is removed in close().
export async function setupTheaters() {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      DatabaseModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({ url: config.db.url }),
      }),
      TheatersModule,
    ],
  }).compile();
  await moduleRef.init();

  const db = moduleRef.get(DatabaseWriteClient);
  const theaters = moduleRef.get(TheaterWriteRepository);
  const rooms = moduleRef.get(RoomWriteRepository);
  const layouts = moduleRef.get(RoomLayoutWriteRepository);
  const seatTypes = moduleRef.get(SeatTypeWriteRepository);
  const theaterIds: string[] = [];
  const seatTypeCodes: string[] = [];

  async function createTheater(): Promise<Theater> {
    const theater = Theater.create({
      name: 'Int Test Cinema',
      slug: `int-${suffix()}`,
      streetAddress: '1 Test Street',
      ward: 'Ward 1',
      province: 'Ho Chi Minh',
    });
    await theaters.create(theater);
    theaterIds.push(theater.id);
    return theater;
  }

  async function createRoom(theater: Theater, code = 'R01'): Promise<Room> {
    const room = Room.create(theater, { code, name: 'Room' });
    await rooms.create(room);
    return room;
  }

  // Saved draft, reloaded so it carries the database updatedAt.
  async function createDraft(
    room: Room,
    theater: Theater,
    cells: SeatCell[] = [{ x: 0, y: 0, seatTypeCode: 'STANDARD' }],
    version = 1,
  ): Promise<RoomLayout> {
    const draft = RoomLayout.createDraft(room, theater, version, { gridRows: 5, gridCols: 5 });
    const types = await seatTypes.findByCodes(cells.map((cell) => cell.seatTypeCode));
    await layouts.create(draft, buildSeatMap(draft, cells, types));
    return reload(draft.id);
  }

  async function reload(layoutId: string): Promise<RoomLayout> {
    const layout = await layouts.findById(layoutId);
    if (!layout) throw new Error(`Layout ${layoutId} not found`);
    return layout;
  }

  function trackSeatType(code: string): string {
    seatTypeCodes.push(code);
    return code;
  }

  async function close(): Promise<void> {
    const where = { room: { theaterId: { in: theaterIds } } };
    await db.roomLayout.deleteMany({ where });
    await db.room.deleteMany({ where: { theaterId: { in: theaterIds } } });
    await db.theater.deleteMany({ where: { id: { in: theaterIds } } });
    await db.seatType.deleteMany({ where: { code: { in: seatTypeCodes } } });
    await moduleRef.close();
  }

  return {
    moduleRef,
    db,
    theaters,
    rooms,
    layouts,
    seatTypes,
    suffix,
    createTheater,
    createRoom,
    createDraft,
    reload,
    trackSeatType,
    close,
  };
}

export type TheatersSetup = Awaited<ReturnType<typeof setupTheaters>>;
