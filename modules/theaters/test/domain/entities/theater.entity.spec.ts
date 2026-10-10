import { describe, expect, it } from 'vitest';
import {
  Theater,
  TheaterClosedException,
  TheaterInvalidStatusTransitionException,
  TheaterNotDraftException,
  type TheaterStatus,
} from '../../../src/domain';
import { theaterWith } from '../fixtures';

const details = {
  name: ' Cinema One ',
  slug: 'cinema-one',
  streetAddress: '1 Main Street',
  ward: 'Ward 1',
  province: 'Ho Chi Minh',
};

const actions = {
  ACTIVE: (theater: Theater) => theater.activate(),
  INACTIVE: (theater: Theater) => theater.deactivate(),
  CLOSED: (theater: Theater) => theater.close(),
} as const;

describe('Theater', () => {
  it('starts as a draft with trimmed details', () => {
    const theater = Theater.create(details);

    expect(theater.status).toBe('DRAFT');
    expect(theater.name).toBe('Cinema One');
    expect(theater.phoneNumber).toBeNull();
  });

  it.each<[TheaterStatus, keyof typeof actions]>([
    ['DRAFT', 'ACTIVE'],
    ['ACTIVE', 'INACTIVE'],
    ['ACTIVE', 'CLOSED'],
    ['INACTIVE', 'ACTIVE'],
    ['INACTIVE', 'CLOSED'],
  ])('moves from %s to %s', (from, to) => {
    const theater = theaterWith(from);

    actions[to](theater);

    expect(theater.status).toBe(to);
  });

  it.each<[TheaterStatus, keyof typeof actions]>([
    ['DRAFT', 'INACTIVE'],
    ['DRAFT', 'CLOSED'],
  ])('refuses to move from %s to %s', (from, to) => {
    expect(() => actions[to](theaterWith(from))).toThrow(TheaterInvalidStatusTransitionException);
  });

  it.each(['ACTIVE', 'INACTIVE'] as const)('treats %s to itself as a no-op', (status) => {
    const theater = theaterWith(status);

    actions[status](theater);

    expect(theater.status).toBe(status);
  });

  it.each(Object.keys(actions) as (keyof typeof actions)[])(
    'is terminal once closed: %s fails',
    (to) => {
      expect(() => actions[to](theaterWith('CLOSED'))).toThrow(TheaterClosedException);
    },
  );

  it('cannot be edited once closed', () => {
    expect(() => theaterWith('CLOSED').update({ name: 'New' })).toThrow(TheaterClosedException);
  });

  it('changes the slug while a draft', () => {
    const theater = theaterWith('DRAFT');

    theater.update({ slug: 'cinema-two' });

    expect(theater.slug.value).toBe('cinema-two');
  });

  it('keeps the slug once opened but still edits other fields', () => {
    const theater = theaterWith('ACTIVE');

    expect(() => theater.update({ slug: 'cinema-two' })).toThrow(TheaterNotDraftException);

    theater.update({ name: 'Cinema Two', slug: 'cinema-one' });
    expect(theater.name).toBe('Cinema Two');
  });

  it('is deletable only while a draft', () => {
    expect(() => theaterWith('DRAFT').assertDeletable()).not.toThrow();
    expect(() => theaterWith('INACTIVE').assertDeletable()).toThrow(TheaterNotDraftException);
  });
});
