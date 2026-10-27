import { describe, expect, it } from 'vitest';
import { decideAccess, type AccessTarget, type Grant } from '../../src/domain';

const grant = (overrides: Partial<Grant> = {}): Grant => ({
  roleKey: 'THEATER_MANAGER',
  scope: 'THEATER',
  clusterId: null,
  theaterId: 'theater-a',
  permissions: ['rooms:create', 'theaters:read'],
  ...overrides,
});

const global = grant({ roleKey: 'CONTENT_MANAGER', scope: 'GLOBAL', theaterId: null });
const cluster = grant({
  roleKey: 'CLUSTER_MANAGER',
  scope: 'CLUSTER',
  clusterId: 'cluster-1',
  theaterId: null,
});

const theater = (theaterId: string | null, clusterId: string | null = null): AccessTarget => ({
  kind: 'THEATER',
  theaterId,
  clusterId,
});

describe('decideAccess', () => {
  it('refuses a permission the role does not hold, whatever the target', () => {
    expect(decideAccess(global, 'theaters:delete', { kind: 'GLOBAL' })).toEqual({
      allowed: false,
    });
  });

  it('refuses a customer grant everywhere', () => {
    const customer = grant({ roleKey: 'CUSTOMER', scope: 'SELF', theaterId: null });

    expect(decideAccess(customer, 'theaters:read', { kind: 'LIST' })).toEqual({ allowed: false });
  });

  describe('GLOBAL grants', () => {
    it('act on any theater and see every theater', () => {
      expect(decideAccess(global, 'rooms:create', theater('theater-b'))).toEqual({
        allowed: true,
        theaters: { all: true },
      });
    });

    it('alone act on what no theater owns', () => {
      expect(decideAccess(global, 'rooms:create', { kind: 'GLOBAL' }).allowed).toBe(true);
      expect(decideAccess(cluster, 'rooms:create', { kind: 'GLOBAL' }).allowed).toBe(false);
      expect(decideAccess(grant(), 'rooms:create', { kind: 'GLOBAL' }).allowed).toBe(false);
    });
  });

  describe('CLUSTER grants', () => {
    it('act on the theaters of their cluster', () => {
      expect(decideAccess(cluster, 'rooms:create', theater('theater-b', 'cluster-1'))).toEqual({
        allowed: true,
        theaters: { all: false, clusterIds: ['cluster-1'], theaterIds: [] },
      });
    });

    it('cannot act on a theater of another cluster, or of none', () => {
      expect(decideAccess(cluster, 'rooms:create', theater('theater-c', 'cluster-2')).allowed).toBe(
        false,
      );
      expect(decideAccess(cluster, 'rooms:create', theater('theater-d', null)).allowed).toBe(false);
    });
  });

  describe('THEATER grants', () => {
    it('act on their theater only', () => {
      expect(decideAccess(grant(), 'rooms:create', theater('theater-a', 'cluster-1')).allowed).toBe(
        true,
      );
      expect(decideAccess(grant(), 'rooms:create', theater('theater-b', 'cluster-1')).allowed).toBe(
        false,
      );
    });

    it('cannot act on an unknown theater', () => {
      expect(decideAccess(grant(), 'rooms:create', theater(null)).allowed).toBe(false);
    });

    it('narrow a list to their theater', () => {
      expect(decideAccess(grant(), 'theaters:read', { kind: 'LIST' })).toEqual({
        allowed: true,
        theaters: { all: false, clusterIds: [], theaterIds: ['theater-a'] },
      });
    });

    it('lost their theater: see nothing', () => {
      expect(decideAccess(grant({ theaterId: null }), 'theaters:read', { kind: 'LIST' })).toEqual({
        allowed: true,
        theaters: { all: false, clusterIds: [], theaterIds: [] },
      });
    });
  });

  it('lets any internal grant read data every theater shares', () => {
    const usher = grant({ roleKey: 'USHER', permissions: ['seat-types:read'] });

    expect(decideAccess(usher, 'seat-types:read', { kind: 'ANY_SCOPE' }).allowed).toBe(true);
  });
});
