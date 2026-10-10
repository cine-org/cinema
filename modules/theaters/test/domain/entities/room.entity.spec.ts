import { describe, expect, it } from 'vitest';
import {
  Room,
  RoomClosedException,
  RoomInvalidCodeException,
  RoomInvalidStatusTransitionException,
  RoomLayoutNotPublishedException,
  RoomNotDraftException,
  TheaterClosedException,
  type RoomStatus,
} from '../../../src/domain';
import { layoutWith, roomWith, theaterWith } from '../fixtures';

const theater = theaterWith('ACTIVE');

describe('Room', () => {
  it('starts as a draft with a normalized code', () => {
    const room = Room.create(theaterWith('DRAFT'), { code: ' r-01 ', name: ' Room 1 ' });

    expect(room.status).toBe('DRAFT');
    expect(room.code).toBe('R-01');
    expect(room.name).toBe('Room 1');
  });

  it.each(['', 'R 01', 'ROOM_01', 'R0123456789'])('rejects the code %j', (code) => {
    expect(() => Room.create(theater, { code, name: 'Room' })).toThrow(RoomInvalidCodeException);
  });

  it('cannot be created in a closed theater', () => {
    expect(() => Room.create(theaterWith('CLOSED'), { code: 'R01', name: 'Room' })).toThrow(
      TheaterClosedException,
    );
  });

  describe('activate', () => {
    it('needs a published layout of this room', () => {
      const room = roomWith('DRAFT', theater);

      room.activate(theater, layoutWith('PUBLISHED', { roomId: room.id }));

      expect(room.status).toBe('ACTIVE');
    });

    it.each([
      ['no layout', () => null],
      ['a draft layout', (roomId: string) => layoutWith('DRAFT', { roomId })],
      ['a retired layout', (roomId: string) => layoutWith('RETIRED', { roomId })],
      ['a layout of another room', () => layoutWith('PUBLISHED')],
    ])('refuses with %s', (_case, layoutFor) => {
      const room = roomWith('DRAFT', theater);

      expect(() => room.activate(theater, layoutFor(room.id))).toThrow(
        RoomLayoutNotPublishedException,
      );
    });

    it('works while the theater is still a draft', () => {
      const draftTheater = theaterWith('DRAFT');
      const room = roomWith('INACTIVE', draftTheater);

      room.activate(draftTheater, layoutWith('PUBLISHED', { roomId: room.id }));

      expect(room.status).toBe('ACTIVE');
    });
  });

  it.each<[RoomStatus, 'deactivate' | 'close', RoomStatus]>([
    ['ACTIVE', 'deactivate', 'INACTIVE'],
    ['ACTIVE', 'close', 'CLOSED'],
    ['INACTIVE', 'close', 'CLOSED'],
    ['INACTIVE', 'deactivate', 'INACTIVE'],
  ])('moves from %s with %s to %s', (from, action, to) => {
    const room = roomWith(from, theater);

    room[action](theater);

    expect(room.status).toBe(to);
  });

  it.each(['deactivate', 'close'] as const)('refuses to %s a draft', (action) => {
    expect(() => roomWith('DRAFT', theater)[action](theater)).toThrow(
      RoomInvalidStatusTransitionException,
    );
  });

  it('is read-only once closed', () => {
    const room = roomWith('CLOSED', theater);

    expect(() => room.update(theater, { name: 'New' })).toThrow(RoomClosedException);
    expect(() => room.deactivate(theater)).toThrow(RoomClosedException);
    expect(() => room.activate(theater, layoutWith('PUBLISHED', { roomId: room.id }))).toThrow(
      RoomClosedException,
    );
  });

  it('is read-only once its theater is closed', () => {
    const closedTheater = theaterWith('CLOSED');
    const room = roomWith('ACTIVE', closedTheater);

    expect(() => room.update(closedTheater, { name: 'New' })).toThrow(TheaterClosedException);
    expect(() => room.deactivate(closedTheater)).toThrow(TheaterClosedException);
  });

  it('changes the code while a draft', () => {
    const room = roomWith('DRAFT', theater);

    room.update(theater, { code: 'r02' });

    expect(room.code).toBe('R02');
  });

  it('keeps the code once opened but still renames', () => {
    const room = roomWith('ACTIVE', theater);

    expect(() => room.update(theater, { code: 'R02' })).toThrow(RoomNotDraftException);

    room.update(theater, { name: 'Room VIP' });
    expect(room.name).toBe('Room VIP');
  });

  it('is deletable only while a draft', () => {
    expect(() => roomWith('DRAFT', theater).assertDeletable()).not.toThrow();
    expect(() => roomWith('CLOSED', theater).assertDeletable()).toThrow(RoomNotDraftException);
  });
});
