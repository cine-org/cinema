import { describe, expect, it } from 'vitest';
import {
  MAX_SEAT_OCCUPANCY,
  MAX_SEAT_WIDTH,
  SeatType,
  SeatTypeInUseException,
  SeatTypeInvalidException,
} from '../../../src/domain';

const details = { name: ' Couple ', maxOccupancy: 2, width: 2 };

describe('SeatType', () => {
  it('creates with a normalized code and name', () => {
    const seatType = SeatType.create(' couple_x ', details);

    expect(seatType).toMatchObject({ code: 'COUPLE_X', name: 'Couple', maxOccupancy: 2, width: 2 });
  });

  it.each(['', 'COUPLE-X', 'A'.repeat(21)])('rejects the code %j', (code) => {
    expect(() => SeatType.create(code, details)).toThrow(SeatTypeInvalidException);
  });

  it('accepts the largest shape', () => {
    const shape = { maxOccupancy: MAX_SEAT_OCCUPANCY, width: MAX_SEAT_WIDTH };

    expect(SeatType.create('BED', { name: 'Bed', ...shape })).toMatchObject(shape);
  });

  it.each([
    ['an empty name', { name: ' ' }],
    ['zero width', { width: 0 }],
    ['too wide', { width: MAX_SEAT_WIDTH + 1 }],
    ['zero occupancy', { maxOccupancy: 0 }],
    ['too many people', { maxOccupancy: MAX_SEAT_OCCUPANCY + 1 }],
    ['a fractional width', { width: 1.5 }],
  ])('rejects %s', (_case, override) => {
    expect(() => SeatType.create('COUPLE', { ...details, ...override })).toThrow(
      SeatTypeInvalidException,
    );
  });

  it('changes its shape while unused', () => {
    const seatType = SeatType.create('COUPLE', details);

    seatType.update({ width: 3, maxOccupancy: 3 }, false);

    expect(seatType).toMatchObject({ width: 3, maxOccupancy: 3 });
  });

  it.each([
    ['width', { width: 3 }],
    ['max occupancy', { maxOccupancy: 3 }],
  ])('locks its %s while in use', (_case, change) => {
    expect(() => SeatType.create('COUPLE', details).update(change, true)).toThrow(
      SeatTypeInUseException,
    );
  });

  it('renames while in use', () => {
    const seatType = SeatType.create('COUPLE', details);

    seatType.update({ name: 'Sweetbox', width: 2 }, true);

    expect(seatType.name).toBe('Sweetbox');
  });

  it('is deletable only while unused', () => {
    const seatType = SeatType.create('COUPLE', details);

    expect(() => seatType.assertDeletable(false)).not.toThrow();
    expect(() => seatType.assertDeletable(true)).toThrow(SeatTypeInUseException);
  });
});
