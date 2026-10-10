import {
  SeatType,
  SeatTypeCodeTakenException,
  SeatTypeInUseException,
  SeatTypeNotFoundException,
} from '@repo/theaters';
import { setupTheaters, type TheatersSetup } from './setup';

describe('PrismaSeatTypeWriteRepository (int)', () => {
  let t: TheatersSetup;

  beforeAll(async () => {
    t = await setupTheaters();
  });

  afterAll(() => t.close());

  async function createSeatType(): Promise<SeatType> {
    const code = t.trackSeatType(`INT_${t.suffix().toUpperCase()}`);
    const seatType = SeatType.create(code, { name: 'Int', maxOccupancy: 1, width: 1 });
    await t.seatTypes.create(seatType);
    return seatType;
  }

  it('rejects a taken code', async () => {
    const seatType = await createSeatType();

    await expect(t.seatTypes.create(seatType)).rejects.toBeInstanceOf(SeatTypeCodeTakenException);
  });

  it('tracks use by any layout and blocks deleting a used type', async () => {
    const seatType = await createSeatType();
    expect(await t.seatTypes.isInUse(seatType.code)).toBe(false);

    const theater = await t.createTheater();
    await t.createDraft(await t.createRoom(theater), theater, [
      { x: 0, y: 0, seatTypeCode: seatType.code },
    ]);

    expect(await t.seatTypes.isInUse(seatType.code)).toBe(true);
    // The foreign key is the backstop when the handler check races.
    await expect(t.seatTypes.delete(seatType.code)).rejects.toBeInstanceOf(SeatTypeInUseException);
  });

  it('deletes an unused type', async () => {
    const seatType = await createSeatType();

    await t.seatTypes.delete(seatType.code);

    expect(await t.seatTypes.findByCode(seatType.code)).toBeNull();
    await expect(t.seatTypes.delete(seatType.code)).rejects.toBeInstanceOf(
      SeatTypeNotFoundException,
    );
  });
});
