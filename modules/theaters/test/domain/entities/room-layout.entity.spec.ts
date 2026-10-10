import { describe, expect, it } from 'vitest';
import {
  MAX_GRID_COLS,
  MAX_GRID_ROWS,
  RoomClosedException,
  RoomLayout,
  RoomLayoutEmptyException,
  RoomLayoutInvalidGridException,
  RoomLayoutNotDraftException,
  RoomLayoutNotPublishedException,
  TheaterClosedException,
} from '../../../src/domain';
import { layoutWith, roomWith, theaterWith } from '../fixtures';

const theater = theaterWith('ACTIVE');
const grid = { gridRows: 10, gridCols: 12 };

describe('RoomLayout', () => {
  it('creates a draft for the room', () => {
    const room = roomWith('ACTIVE', theater);
    const layout = RoomLayout.createDraft(room, theater, 3, grid);

    expect(layout).toMatchObject({ roomId: room.id, version: 3, status: 'DRAFT', ...grid });
    expect(layout.publishedAt).toBeNull();
    expect(layout.updatedAt).toBeNull();
  });

  it('cannot be drafted for a closed room or theater', () => {
    const closedTheater = theaterWith('CLOSED');

    expect(() => RoomLayout.createDraft(roomWith('CLOSED', theater), theater, 1, grid)).toThrow(
      RoomClosedException,
    );
    expect(() =>
      RoomLayout.createDraft(roomWith('ACTIVE', closedTheater), closedTheater, 1, grid),
    ).toThrow(TheaterClosedException);
  });

  it('accepts the largest grid', () => {
    const room = roomWith('DRAFT', theater);
    const largest = { gridRows: MAX_GRID_ROWS, gridCols: MAX_GRID_COLS };

    expect(RoomLayout.createDraft(room, theater, 1, largest)).toMatchObject(largest);
  });

  it.each([
    ['no rows', { gridRows: 0, gridCols: 10 }],
    ['too many rows', { gridRows: MAX_GRID_ROWS + 1, gridCols: 10 }],
    ['too many columns', { gridRows: 10, gridCols: MAX_GRID_COLS + 1 }],
    ['a fractional size', { gridRows: 10.5, gridCols: 10 }],
  ])('rejects a grid with %s', (_case, invalid) => {
    expect(() => RoomLayout.createDraft(roomWith('DRAFT', theater), theater, 1, invalid)).toThrow(
      RoomLayoutInvalidGridException,
    );
  });

  it('resizes only a draft', () => {
    const draft = layoutWith('DRAFT');

    draft.resize(grid);

    expect(draft).toMatchObject(grid);
    expect(() => layoutWith('PUBLISHED').resize(grid)).toThrow(RoomLayoutNotDraftException);
  });

  it('publishes a draft with seats', () => {
    const layout = layoutWith('DRAFT');

    layout.publish(1);

    expect(layout.status).toBe('PUBLISHED');
    expect(layout.publishedAt).toBeInstanceOf(Date);
  });

  it('refuses to publish an empty draft', () => {
    expect(() => layoutWith('DRAFT').publish(0)).toThrow(RoomLayoutEmptyException);
  });

  it.each(['PUBLISHED', 'RETIRED'] as const)('refuses to publish a %s layout', (status) => {
    expect(() => layoutWith(status).publish(1)).toThrow(RoomLayoutNotDraftException);
  });

  it('retires only a published layout', () => {
    const layout = layoutWith('PUBLISHED');

    layout.retire();

    expect(layout.status).toBe('RETIRED');
    expect(() => layoutWith('DRAFT').retire()).toThrow(RoomLayoutNotPublishedException);
    expect(() => layoutWith('RETIRED').retire()).toThrow(RoomLayoutNotPublishedException);
  });
});
