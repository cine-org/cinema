// Dev/test data only, never run against prod. Idempotent, so `pnpm db:seed` can run any time.
import { DatabaseReadClient, DatabaseWriteClient } from '@repo/database';
import {
  ActivateRoomCommand,
  ActivateRoomHandler,
  ActivateTheaterCommand,
  ActivateTheaterHandler,
  CreateRoomCommand,
  CreateRoomHandler,
  CreateTheaterCommand,
  CreateTheaterHandler,
  DeactivateRoomCommand,
  DeactivateRoomHandler,
  DeactivateSeatCommand,
  DeactivateSeatHandler,
  GetRoomLayoutHandler,
  GetRoomLayoutQuery,
  PublishRoomLayoutDraftCommand,
  PublishRoomLayoutDraftHandler,
  UpsertRoomLayoutDraftCommand,
  UpsertRoomLayoutDraftHandler,
} from '../src/app';
import {
  PrismaRoomLayoutReadRepository,
  PrismaRoomLayoutWriteRepository,
  PrismaRoomWriteRepository,
  PrismaSeatTypeWriteRepository,
  PrismaSeatWriteRepository,
  PrismaTheaterReadRepository,
  PrismaTheaterWriteRepository,
} from '../src/infra';
import { LAYOUT_GRID, randomLayout, THEATERS, type RoomSeed } from './data';

// Goes through the handlers so seeded data obeys the same rules as data made through the API.
async function seed(url: string): Promise<void> {
  // Seeding writes, so both sides use the same owner URL.
  const write = new DatabaseWriteClient({ url });
  const read = new DatabaseReadClient({ url });

  const theaters = new PrismaTheaterWriteRepository(write);
  const rooms = new PrismaRoomWriteRepository(write);
  const layouts = new PrismaRoomLayoutWriteRepository(write);
  const seats = new PrismaSeatWriteRepository(write);
  const seatTypes = new PrismaSeatTypeWriteRepository(write);
  const theaterReader = new PrismaTheaterReadRepository(read);

  const createTheater = new CreateTheaterHandler(theaters);
  const activateTheater = new ActivateTheaterHandler(theaters);
  const createRoom = new CreateRoomHandler(rooms, theaters);
  const activateRoom = new ActivateRoomHandler(rooms, theaters, layouts);
  const deactivateRoom = new DeactivateRoomHandler(rooms, theaters);
  const saveDraft = new UpsertRoomLayoutDraftHandler(rooms, theaters, layouts, seatTypes);
  const publish = new PublishRoomLayoutDraftHandler(rooms, theaters, layouts);
  const deactivateSeat = new DeactivateSeatHandler(seats, layouts, rooms, theaters);
  const getLayout = new GetRoomLayoutHandler(new PrismaRoomLayoutReadRepository(read));

  const draft = (roomId: string) =>
    saveDraft.execute(
      new UpsertRoomLayoutDraftCommand({
        roomId,
        grid: LAYOUT_GRID,
        seats: randomLayout(),
      }),
    );

  async function seedRoom(theaterId: string, room: RoomSeed): Promise<void> {
    const { id: roomId } = await createRoom.execute(
      new CreateRoomCommand({ theaterId, details: { code: room.code, name: room.name } }),
    );

    for (let version = 0; version < (room.retiredVersions ?? 0); version++) {
      await draft(roomId);
      await publish.execute(new PublishRoomLayoutDraftCommand(roomId));
    }

    await draft(roomId);
    if (room.status === 'DRAFT') return;

    const { id: layoutId } = await publish.execute(new PublishRoomLayoutDraftCommand(roomId));
    await activateRoom.execute(new ActivateRoomCommand(roomId));

    const layout = await getLayout.execute(new GetRoomLayoutQuery({ roomId, layoutId }));
    for (const seat of layout.seats.filter((s) => room.brokenSeats?.includes(s.seatCode))) {
      await deactivateSeat.execute(new DeactivateSeatCommand(seat.id));
    }

    if (room.status === 'INACTIVE') {
      await deactivateRoom.execute(new DeactivateRoomCommand(roomId));
    }
  }

  for (const theater of THEATERS) {
    if (await theaterReader.findBySlug(theater.details.slug)) continue;

    const { id } = await createTheater.execute(new CreateTheaterCommand(theater.details));
    for (const room of theater.rooms) {
      await seedRoom(id, room);
    }

    if (theater.status === 'ACTIVE') {
      await activateTheater.execute(new ActivateTheaterCommand(id));
    }
    console.log(`seeded theater ${theater.details.slug} (${theater.rooms.length} rooms)`);
  }

  // Clusters have no handlers yet, so they are written directly: one per province, holding the
  // seeded theaters of that province.
  for (const province of new Set(THEATERS.map((theater) => theater.details.province))) {
    const cluster = await write.cluster.upsert({
      where: { name: province },
      update: {},
      create: { name: province },
    });
    const slugs = THEATERS.filter((theater) => theater.details.province === province).map(
      (theater) => theater.details.slug,
    );
    const { count } = await write.theater.updateMany({
      where: { slug: { in: slugs }, clusterId: null },
      data: { clusterId: cluster.id },
    });
    if (count > 0) console.log(`seeded cluster ${province} (${count} theaters)`);
  }
}

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL is required to seed; run `pnpm db:seed` from the root');
  process.exit(1);
}

seed(url)
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
