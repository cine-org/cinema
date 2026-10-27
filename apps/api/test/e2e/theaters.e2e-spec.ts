import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DatabaseWriteClient } from '@repo/database';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { setupHttp } from '@/bootstrap';
import { ConfigService } from '@/config';
import { internalAccounts } from './support/internal-accounts';

type Body<T = Record<string, unknown>> = {
  success: boolean;
  code?: string;
  errors?: { field: string }[];
  data: T;
  meta?: Record<string, unknown>;
};
type Seat = { id: string; seatCode: string; seatTypeCode: string; status: string };
type Layout = { id: string; version: number; status: string; seats: Seat[] };

const suffix = () => crypto.randomUUID().slice(0, 8);
const body = <T>(res: request.Response) => res.body as Body<T>;

describe('Theaters (e2e)', () => {
  let app: INestApplication;
  const theaterIds: string[] = [];
  const seatTypeCodes: string[] = [];

  const admins = internalAccounts(() => app);
  let adminToken = '';
  // Admin routes need an ADMIN session; user routes ignore the header.
  const api = () => request.agent(app.getHttpServer()).set('Authorization', `Bearer ${adminToken}`);
  const url = (path: string) => `/api/v1/admin${path}`;
  const userUrl = (path: string) => `/api/v1${path}`;

  async function createTheater(slug = `e2e-${suffix()}`, name = 'E2E Cinema'): Promise<string> {
    const res = await api()
      .post(url('/theaters'))
      .send({
        name,
        slug,
        streetAddress: '1 Test Street',
        ward: 'Ward 1',
        province: 'Ho Chi Minh',
        phoneNumber: '028 1234 5678',
      })
      .expect(201);
    const { id } = body<{ id: string }>(res).data;
    theaterIds.push(id);
    return id;
  }

  async function createRoom(theaterId: string, code = 'R01'): Promise<string> {
    const res = await api()
      .post(url(`/theaters/${theaterId}/rooms`))
      .send({ code, name: 'Room 1' })
      .expect(201);
    return body<{ id: string }>(res).data.id;
  }

  const seatMap = {
    gridRows: 4,
    gridCols: 6,
    seats: [
      { x: 0, y: 0, seatTypeCode: 'standard' },
      { x: 1, y: 0, seatTypeCode: 'STANDARD' },
      // Row 1 is an aisle: row 2 still gets the letter B.
      { x: 0, y: 2, seatTypeCode: 'COUPLE' },
      { x: 2, y: 2, seatTypeCode: 'VIP' },
    ],
  };

  async function publishLayout(roomId: string, map = seatMap): Promise<string> {
    await api()
      .put(url(`/rooms/${roomId}/layouts/draft`))
      .send(map)
      .expect(200);
    const res = await api()
      .post(url(`/rooms/${roomId}/layouts/draft/publish`))
      .expect(200);
    return body<{ id: string }>(res).data.id;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupHttp(app);
    await app.init();
    const origin = new URL(app.get(ConfigService).app.apiOrigin).origin;
    ({ accessToken: adminToken } = await admins.signIn(
      (await admins.create('SUPER_ADMIN')).email,
      origin,
    ));
  });

  afterAll(async () => {
    await admins.cleanup();
    const db = app.get(DatabaseWriteClient);
    await db.roomLayout.deleteMany({ where: { room: { theaterId: { in: theaterIds } } } });
    await db.room.deleteMany({ where: { theaterId: { in: theaterIds } } });
    await db.theater.deleteMany({ where: { id: { in: theaterIds } } });
    await db.seatType.deleteMany({ where: { code: { in: seatTypeCodes } } });
    await app.close();
  });

  it('sets up a theater from draft to sellable', async () => {
    const theaterId = await createTheater();
    const roomId = await createRoom(theaterId, 'r-01');

    const draftRes = await api()
      .put(url(`/rooms/${roomId}/layouts/draft`))
      .send(seatMap)
      .expect(200);
    const draftId = body<{ id: string }>(draftRes).data.id;

    const draft = body<Layout>(
      await api()
        .get(url(`/rooms/${roomId}/layouts/draft`))
        .expect(200),
    ).data;
    expect(draft).toMatchObject({ id: draftId, version: 1, status: 'DRAFT' });
    expect(draft.seats.map((seat) => [seat.seatCode, seat.seatTypeCode])).toEqual([
      ['A01', 'STANDARD'],
      ['A02', 'STANDARD'],
      ['B01', 'COUPLE'],
      ['B02', 'VIP'],
    ]);

    await api()
      .post(url(`/rooms/${roomId}/layouts/draft/publish`))
      .expect(200);
    await api()
      .post(url(`/rooms/${roomId}/activate`))
      .expect(200);
    await api()
      .post(url(`/theaters/${theaterId}/activate`))
      .expect(200);

    const room = await api()
      .get(url(`/rooms/${roomId}`))
      .expect(200);
    expect(body(room).data).toMatchObject({
      code: 'R-01',
      status: 'ACTIVE',
      publishedLayoutId: draftId,
      seatCount: 4,
      capacity: 5,
      inactiveSeats: 0,
    });

    const theater = await api()
      .get(url(`/theaters/${theaterId}`))
      .expect(200);
    expect(body(theater).data).toMatchObject({ status: 'ACTIVE', phoneNumber: '+842812345678' });
  });

  describe('room layouts', () => {
    it('keeps one draft and replaces its seats on every save', async () => {
      const roomId = await createRoom(await createTheater());

      const first = await api()
        .put(url(`/rooms/${roomId}/layouts/draft`))
        .send(seatMap);
      const second = await api()
        .put(url(`/rooms/${roomId}/layouts/draft`))
        .send({ gridRows: 2, gridCols: 2, seats: [{ x: 1, y: 1, seatTypeCode: 'VIP' }] })
        .expect(200);

      expect(body(second).data).toEqual(body(first).data);
      const draft = body<Layout & { gridRows: number }>(
        await api().get(url(`/rooms/${roomId}/layouts/draft`)),
      ).data;
      expect(draft.gridRows).toBe(2);
      expect(draft.seats.map((seat) => seat.seatCode)).toEqual(['A01']);
    });

    it('retires the previous version on publish and lists newest first', async () => {
      const roomId = await createRoom(await createTheater());
      const v1 = await publishLayout(roomId);
      const v2 = await publishLayout(roomId);

      const res = await api()
        .get(url(`/rooms/${roomId}/layouts`))
        .expect(200);

      expect(
        body<Layout[]>(res).data.map(({ id, version, status }) => [id, version, status]),
      ).toEqual([
        [v2, 2, 'PUBLISHED'],
        [v1, 1, 'RETIRED'],
      ]);
      const old = await api()
        .get(url(`/rooms/${roomId}/layouts/${v1}`))
        .expect(200);
      expect(body<Layout>(old).data.seats).toHaveLength(4);
    });

    it('points at the overlapping seat', async () => {
      const roomId = await createRoom(await createTheater());

      const res = await api()
        .put(url(`/rooms/${roomId}/layouts/draft`))
        .send({
          gridRows: 2,
          gridCols: 4,
          seats: [
            { x: 0, y: 0, seatTypeCode: 'COUPLE' },
            { x: 1, y: 0, seatTypeCode: 'STANDARD' },
          ],
        })
        .expect(400);

      expect(body(res)).toMatchObject({
        code: 'SEAT.DUPLICATE_POSITION',
        errors: [{ field: 'seats.1' }],
      });
    });

    it.each([
      ['a grid over the limit', { gridRows: 31, gridCols: 10, seats: [] }, 'VALIDATION'],
      [
        'an unknown seat type',
        { gridRows: 2, gridCols: 2, seats: [{ x: 0, y: 0, seatTypeCode: 'BED' }] },
        'SEAT.UNKNOWN_TYPE',
      ],
      [
        'a seat outside the grid',
        { gridRows: 2, gridCols: 2, seats: [{ x: 1, y: 0, seatTypeCode: 'COUPLE' }] },
        'SEAT.INVALID_PLACEMENT',
      ],
    ])('rejects %s', async (_case, map, code) => {
      const roomId = await createRoom(await createTheater());

      const res = await api()
        .put(url(`/rooms/${roomId}/layouts/draft`))
        .send(map)
        .expect(400);

      expect(body(res).code).toBe(code);
    });

    it('refuses to publish an empty draft or a missing one', async () => {
      const roomId = await createRoom(await createTheater());
      const publish = () => api().post(url(`/rooms/${roomId}/layouts/draft/publish`));

      expect(body(await publish().expect(404)).code).toBe('ROOM.LAYOUT_NOT_FOUND');

      await api()
        .put(url(`/rooms/${roomId}/layouts/draft`))
        .send({ gridRows: 2, gridCols: 2, seats: [] })
        .expect(200);
      expect(body(await publish().expect(409)).code).toBe('ROOM.LAYOUT_EMPTY');
    });

    it('refuses to activate a room without a published layout', async () => {
      const roomId = await createRoom(await createTheater());

      const res = await api()
        .post(url(`/rooms/${roomId}/activate`))
        .expect(409);

      expect(body(res).code).toBe('ROOM.LAYOUT_NOT_PUBLISHED');
    });
  });

  describe('seats', () => {
    it('deactivates a seat of the published layout', async () => {
      const roomId = await createRoom(await createTheater());
      const layoutId = await publishLayout(roomId);
      const layout = body<Layout>(
        await api().get(url(`/rooms/${roomId}/layouts/${layoutId}`)),
      ).data;
      const seatId = layout.seats[0]!.id;

      await api()
        .post(url(`/seats/${seatId}/deactivate`))
        .expect(200);

      const room = await api().get(url(`/rooms/${roomId}`));
      expect(body(room).data).toMatchObject({ seatCount: 4, inactiveSeats: 1 });
    });

    it('refuses to change a seat of a draft', async () => {
      const roomId = await createRoom(await createTheater());
      await api()
        .put(url(`/rooms/${roomId}/layouts/draft`))
        .send(seatMap)
        .expect(200);
      const draft = body<Layout>(await api().get(url(`/rooms/${roomId}/layouts/draft`))).data;

      const res = await api()
        .post(url(`/seats/${draft.seats[0]!.id}/deactivate`))
        .expect(409);

      expect(body(res).code).toBe('ROOM.LAYOUT_NOT_PUBLISHED');
    });
  });

  describe('theaters and rooms', () => {
    it('rejects a taken slug or room code', async () => {
      const slug = `e2e-${suffix()}`;
      const theaterId = await createTheater(slug);
      await createRoom(theaterId, 'R01');

      const theater = await api()
        .post(url('/theaters'))
        .send({ name: 'Dup', slug, streetAddress: 'x', ward: 'x', province: 'x' })
        .expect(409);
      const room = await api()
        .post(url(`/theaters/${theaterId}/rooms`))
        .send({ code: 'r01', name: 'Dup' })
        .expect(409);

      expect(body(theater).code).toBe('THEATER.SLUG_TAKEN');
      expect(body(room).code).toBe('ROOM.CODE_TAKEN');
    });

    it('rejects an invalid phone number', async () => {
      const res = await api()
        .post(url('/theaters'))
        .send({
          name: 'x',
          slug: `e2e-${suffix()}`,
          streetAddress: 'x',
          ward: 'x',
          province: 'x',
          phoneNumber: '123',
        })
        .expect(400);

      expect(body(res)).toMatchObject({ code: 'VALIDATION', errors: [{ field: 'phoneNumber' }] });
    });

    it('lets a new room reuse the code of a closed one', async () => {
      const theaterId = await createTheater();
      const roomId = await createRoom(theaterId, 'R01');
      await publishLayout(roomId);
      await api()
        .post(url(`/rooms/${roomId}/activate`))
        .expect(200);
      await api()
        .post(url(`/rooms/${roomId}/close`))
        .expect(200);

      await createRoom(theaterId, 'R01');
    });

    it('deletes only drafts and keeps a closed theater read-only', async () => {
      const theaterId = await createTheater();
      const roomId = await createRoom(theaterId);
      await publishLayout(roomId);
      await api()
        .post(url(`/rooms/${roomId}/activate`))
        .expect(200);

      expect(
        body(
          await api()
            .delete(url(`/rooms/${roomId}`))
            .expect(409),
        ).code,
      ).toBe('ROOM.NOT_DRAFT');

      await api()
        .post(url(`/theaters/${theaterId}/activate`))
        .expect(200);
      await api()
        .post(url(`/theaters/${theaterId}/close`))
        .expect(200);

      const edit = await api()
        .patch(url(`/theaters/${theaterId}`))
        .send({ name: 'New' });
      const newRoom = await api()
        .post(url(`/theaters/${theaterId}/rooms`))
        .send({ code: 'R02', name: 'Room 2' });
      expect([edit.status, body(edit).code]).toEqual([409, 'THEATER.CLOSED']);
      expect([newRoom.status, body(newRoom).code]).toEqual([409, 'THEATER.CLOSED']);
    });

    it('deletes a draft theater', async () => {
      const theaterId = await createTheater();

      await api()
        .delete(url(`/theaters/${theaterId}`))
        .expect(200);

      expect(
        body(
          await api()
            .get(url(`/theaters/${theaterId}`))
            .expect(404),
        ).code,
      ).toBe('THEATER.NOT_FOUND');
    });

    it('returns 404 for unknown ids and 400 for malformed ones', async () => {
      const unknown = crypto.randomUUID();

      expect(
        body(
          await api()
            .get(url(`/rooms/${unknown}`))
            .expect(404),
        ).code,
      ).toBe('ROOM.NOT_FOUND');
      expect(
        body(
          await api()
            .get(url(`/theaters/${unknown}/rooms`))
            .expect(404),
        ).code,
      ).toBe('THEATER.NOT_FOUND');
      await api().get(url('/theaters/not-a-uuid')).expect(400);
    });

    it('lists theaters by search, status and sort, one page at a time', async () => {
      const tag = suffix();
      const slugs = [`e2e-${tag}-c`, `e2e-${tag}-b`, `e2e-${tag}-a`];
      for (const slug of slugs) await createTheater(slug, `E2E ${slug}`);

      const res = await api()
        .get(url('/theaters'))
        .query({ q: tag, status: 'DRAFT', sort: 'name:asc', page: 1, limit: 2 })
        .expect(200);

      expect(body<{ slug: string }[]>(res).data.map((theater) => theater.slug)).toEqual([
        `e2e-${tag}-a`,
        `e2e-${tag}-b`,
      ]);
      expect(body(res).meta).toMatchObject({ page: 1, limit: 2, total: 3, hasNextPage: true });
    });
  });

  describe('seat types', () => {
    const newCode = () => {
      const code = `E2E_${suffix().toUpperCase()}`;
      seatTypeCodes.push(code);
      return code;
    };

    it('creates, reads and renames a seat type', async () => {
      const code = newCode();

      const created = await api()
        .post(url('/seat-types'))
        .send({ code: code.toLowerCase(), name: 'Bed', maxOccupancy: 2, width: 2 })
        .expect(201);
      expect(body(created).data).toEqual({ code });

      await api()
        .patch(url(`/seat-types/${code}`))
        .send({ name: 'Day bed' })
        .expect(200);

      const res = await api()
        .get(url(`/seat-types/${code.toLowerCase()}`))
        .expect(200);
      expect(body(res).data).toMatchObject({ code, name: 'Day bed', width: 2, maxOccupancy: 2 });
    });

    it('locks the shape of a used type and refuses to delete it', async () => {
      const code = newCode();
      await api()
        .post(url('/seat-types'))
        .send({ code, name: 'Bed', maxOccupancy: 1, width: 1 })
        .expect(201);
      const roomId = await createRoom(await createTheater());
      await api()
        .put(url(`/rooms/${roomId}/layouts/draft`))
        .send({ gridRows: 1, gridCols: 1, seats: [{ x: 0, y: 0, seatTypeCode: code }] })
        .expect(200);

      const resize = await api()
        .patch(url(`/seat-types/${code}`))
        .send({ width: 2 })
        .expect(409);
      const remove = await api()
        .delete(url(`/seat-types/${code}`))
        .expect(409);

      expect(body(resize).code).toBe('SEAT.TYPE_IN_USE');
      expect(body(remove).code).toBe('SEAT.TYPE_IN_USE');
    });

    it('deletes an unused type', async () => {
      const code = newCode();
      await api()
        .post(url('/seat-types'))
        .send({ code, name: 'Bed', maxOccupancy: 1, width: 1 })
        .expect(201);

      await api()
        .delete(url(`/seat-types/${code}`))
        .expect(200);

      expect(
        body(
          await api()
            .get(url(`/seat-types/${code}`))
            .expect(404),
        ).code,
      ).toBe('SEAT.TYPE_NOT_FOUND');
    });

    it('rejects a shape over the limit', async () => {
      const res = await api()
        .post(url('/seat-types'))
        .send({ code: newCode(), name: 'Bed', maxOccupancy: 5, width: 1 })
        .expect(400);

      expect(body(res).code).toBe('VALIDATION');
    });
  });

  describe('customer routes', () => {
    it('shows only open theaters', async () => {
      const tag = `e2e-open-${suffix()}`;
      const openSlug = `${tag}-a`;
      const openId = await createTheater(openSlug, `${tag} A`);
      const roomId = await createRoom(openId);
      await publishLayout(roomId);
      await api()
        .post(url(`/rooms/${roomId}/activate`))
        .expect(200);
      await api()
        .post(url(`/theaters/${openId}/activate`))
        .expect(200);
      const draftSlug = `${tag}-b`;
      await createTheater(draftSlug, `${tag} B`);

      const list = await api().get(userUrl('/theaters')).query({ q: tag }).expect(200);
      expect(body<{ slug: string }[]>(list).data.map((theater) => theater.slug)).toEqual([
        openSlug,
      ]);
      expect(body<Record<string, unknown>[]>(list).data[0]).not.toHaveProperty('status');

      await api()
        .get(userUrl(`/theaters/slug/${openSlug}`))
        .expect(200);
      await api()
        .get(userUrl(`/theaters/slug/${draftSlug}`))
        .expect(404);
      await api().get(userUrl('/theaters')).query({ status: 'DRAFT' }).expect(400);
    });
  });
});
