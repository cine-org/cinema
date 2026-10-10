import { ConflictException } from '@repo/common';
import { setupTheaters, type TheatersSetup } from './setup';

describe('PrismaRoomLayoutWriteRepository (int)', () => {
  let t: TheatersSetup;

  beforeAll(async () => {
    t = await setupTheaters();
  });

  afterAll(() => t.close());

  it('rejects a stale write (optimistic lock)', async () => {
    const theater = await t.createTheater();
    const room = await t.createRoom(theater);
    const draft = await t.createDraft(room, theater);
    const first = await t.reload(draft.id);
    const second = await t.reload(draft.id);

    first.resize({ gridRows: 6, gridCols: 6 });
    await t.layouts.update(first);

    second.resize({ gridRows: 7, gridCols: 7 });
    await expect(t.layouts.update(second)).rejects.toBeInstanceOf(ConflictException);
    expect(await t.reload(draft.id)).toMatchObject({ gridRows: 6, gridCols: 6 });
  });

  it('replaces the whole seat list on update', async () => {
    const theater = await t.createTheater();
    const room = await t.createRoom(theater);
    const draft = await t.createDraft(room, theater);

    await t.layouts.update(draft, []);

    expect(await t.layouts.countSeats(draft.id)).toBe(0);
  });

  it('allows only one draft per room', async () => {
    const theater = await t.createTheater();
    const room = await t.createRoom(theater);
    await t.createDraft(room, theater);

    await expect(t.createDraft(room, theater, undefined, 2)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(await t.layouts.latestVersion(room.id)).toBe(1);
  });

  it('publishes the next version and retires the previous one in one transaction', async () => {
    const theater = await t.createTheater();
    const room = await t.createRoom(theater);
    const first = await t.createDraft(room, theater);
    first.publish(1);
    await t.layouts.updateMany([first]);

    const previous = await t.reload(first.id);
    const draft = await t.createDraft(room, theater, undefined, 2);
    previous.retire();
    draft.publish(1);

    // Publishing first breaks the one-published index; the transaction rolls back.
    await expect(t.layouts.updateMany([draft, previous])).rejects.toThrow();
    expect((await t.layouts.findPublished(room.id))?.id).toBe(first.id);

    await t.layouts.updateMany([previous, draft]);

    expect((await t.layouts.findPublished(room.id))?.id).toBe(draft.id);
    expect((await t.reload(first.id)).status).toBe('RETIRED');
    expect(await t.layouts.findDraft(room.id)).toBeNull();
  });
});
