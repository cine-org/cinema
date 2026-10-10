import { describe, expect, it } from 'vitest';
import { Seat, SeatInvalidPlacementException } from '../../../src/domain';

const details = { seatTypeCode: 'standard', x: 0, y: 0, rowLabel: 'A', columnNumber: 1 };

describe('Seat', () => {
  it.each([
    [0, 'A'],
    [7, 'H'],
    [8, 'J'],
    [12, 'N'],
    [13, 'P'],
    [23, 'Z'],
    [24, 'AA'],
    [25, 'AB'],
  ])('labels row index %i as %s, skipping I and O', (index, label) => {
    expect(Seat.rowLabelAt(index)).toBe(label);
  });

  it.each([
    ['A', 1, 'A01'],
    ['B', 12, 'B12'],
    ['AA', 7, 'AA07'],
    ['C', 100, 'C100'],
  ])('builds and parses the code of %s/%i', (rowLabel, columnNumber, code) => {
    expect(Seat.buildCode(rowLabel, columnNumber)).toBe(code);
    expect(Seat.parseCode(code)).toEqual({ rowLabel, columnNumber });
  });

  it('parses a lowercase code', () => {
    expect(Seat.parseCode(' b03 ')).toEqual({ rowLabel: 'B', columnNumber: 3 });
  });

  it.each(['A1', 'I01', 'O01', '01', 'A', ''])('rejects the code %j', (code) => {
    expect(Seat.parseCode(code)).toBeNull();
  });

  it('creates an active seat with a normalized type code', () => {
    const seat = Seat.create('layout-1', details);

    expect(seat.status).toBe('ACTIVE');
    expect(seat.seatTypeCode).toBe('STANDARD');
    expect(seat.seatCode).toBe('A01');
  });

  it.each([
    ['empty type code', { seatTypeCode: ' ' }],
    ['negative x', { x: -1 }],
    ['row label with I', { rowLabel: 'I' }],
    ['column zero', { columnNumber: 0 }],
  ])('rejects %s', (_case, override) => {
    expect(() => Seat.create('layout-1', { ...details, ...override })).toThrow(
      SeatInvalidPlacementException,
    );
  });

  it('deactivates and activates again', () => {
    const seat = Seat.create('layout-1', details);

    seat.deactivate();
    expect(seat.status).toBe('INACTIVE');

    seat.activate();
    expect(seat.status).toBe('ACTIVE');
  });
});
