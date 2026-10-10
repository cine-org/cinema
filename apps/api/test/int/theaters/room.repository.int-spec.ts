import {
  Room,
  RoomCodeTakenException,
  RoomReadRepository,
  SeatWriteRepository,
} from '@repo/theaters';
import { setupTheaters, type TheatersSetup } from './setup';

describe('Prisma room repositories (int)', () => {
  let t: TheatersSetup;

  beforeAll(async () => {
    t = await setupTheaters();
  });

  afterAll(() => t.close());

  it('rejects a code taken by an open room of the same theater', async () => {
    const theater = await t.createTheater();
    await t.createRoom(theater, 'R01');

    await expect(t.createRoom(theater, 'R01')).rejects.toBeInstanceOf(RoomCodeTakenException);
  });

  it('allows the same code in another theater', async () => {
    await t.createRoom(await t.createTheater(), 'R01');

    await expect(t.createRoom(await t.createTheater(), 'R01')).resolves.toBeDefined();
  });

  it('frees the code of a closed room', async () => {
    const theater = await t.createTheater();
    const closed = await t.createRoom(theater, 'R01');
    await t.rooms.update(Room.restore({ ...snapshot(closed), status: 'CLOSED' }));

    await expect(t.createRoom(theater, 'R01')).resolves.toBeDefined();
  });

  it('deletes a room together with its layouts and seats', async () => {
    const theater = await t.createTheater();
    const room = await t.createRoom(theater);
    const draft = await t.createDraft(room, theater);

    await t.rooms.delete(room.id);

    expect(await t.rooms.findById(room.id)).toBeNull();
    expect(await t.layouts.findById(draft.id)).toBeNull();
    expect(await t.db.seat.count({ where: { layoutId: draft.id } })).toBe(0);
  });

  it('reports the published layout stats', async () => {
    const theater = await t.createTheater();
    const room = await t.createRoom(theater);
    const draft = await t.createDraft(room, theater, [
      { x: 0, y: 0, seatTypeCode: 'STANDARD' },
      { x: 1, y: 0, seatTypeCode: 'STANDARD' },
      { x: 0, y: 1, seatTypeCode: 'COUPLE' },
    ]);
    draft.publish(3);
    await t.layouts.updateMany([draft]);

    const seats = t.moduleRef.get(SeatWriteRepository);
    const [first] = await t.db.seat.findMany({ where: { layoutId: draft.id }, take: 1 });
    const seat = await seats.findById(first!.id);
    seat!.deactivate();
    await seats.update(seat!);

    const view = await t.moduleRef.get(RoomReadRepository).findById(room.id);

    expect(view).toMatchObject({
      publishedLayoutId: draft.id,
      seatCount: 3,
      capacity: 4,
      inactiveSeats: 1,
    });
  });
});

function snapshot(room: Room) {
  return {
    id: room.id,
    theaterId: room.theaterId,
    code: room.code,
    name: room.name,
    status: room.status,
  };
}
