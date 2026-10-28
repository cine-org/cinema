import { describe, expect, it } from 'vitest';
import { decideAccess, visibleTheaters, type AccessGrant } from '../../src/domain';

const grant = (input: Partial<AccessGrant> = {}): AccessGrant => ({
  roleKey: 'THEATER_MANAGER',
  scope: 'THEATER',
  clusterId: null,
  theaterId: 'q1',
  permissions: new Set(['rooms:create']),
  ...input,
});

const q1 = { theaterId: 'q1', clusterId: 'hcm' };
const q7 = { theaterId: 'q7', clusterId: 'hcm' };
const hanoi = { theaterId: 'hk', clusterId: 'hn' };
const alone = { theaterId: 'dl', clusterId: null };

const allowed = { allowed: true };
const denied = { allowed: false, permission: 'rooms:create' };

describe('decideAccess', () => {
  it('refuses a permission the role does not hold, wherever', () => {
    const superAdmin = grant({ scope: 'GLOBAL', theaterId: null, permissions: new Set() });

    expect(decideAccess(superAdmin, 'rooms:create', q1)).toEqual(denied);
    expect(decideAccess(superAdmin, 'rooms:create', null)).toEqual(denied);
  });

  it('lets a global grant act on any theater', () => {
    const global = grant({ scope: 'GLOBAL', theaterId: null });

    expect(decideAccess(global, 'rooms:create', hanoi)).toEqual(allowed);
    expect(decideAccess(global, 'rooms:create', alone)).toEqual(allowed);
  });

  it('keeps a cluster grant to the theaters of its cluster', () => {
    const cluster = grant({ scope: 'CLUSTER', clusterId: 'hcm', theaterId: null });

    expect(decideAccess(cluster, 'rooms:create', q1)).toEqual(allowed);
    expect(decideAccess(cluster, 'rooms:create', q7)).toEqual(allowed);
    expect(decideAccess(cluster, 'rooms:create', hanoi)).toEqual(denied);
    expect(decideAccess(cluster, 'rooms:create', alone)).toEqual(denied);
  });

  it('keeps a theater grant to its theater', () => {
    expect(decideAccess(grant(), 'rooms:create', q1)).toEqual(allowed);
    expect(decideAccess(grant(), 'rooms:create', q7)).toEqual(denied);
  });

  it('lets any internal scope act on what belongs to no theater', () => {
    expect(decideAccess(grant(), 'rooms:create', null)).toEqual(allowed);
  });

  it('refuses the customer scope everything', () => {
    const customer = grant({ roleKey: 'CUSTOMER', scope: 'SELF', theaterId: null });

    expect(decideAccess(customer, 'rooms:create', null)).toEqual(denied);
    expect(decideAccess(customer, 'rooms:create', q1)).toEqual(denied);
  });
});

describe('visibleTheaters', () => {
  it('shows each scope its own theaters', () => {
    expect(visibleTheaters(grant({ scope: 'GLOBAL', theaterId: null }))).toEqual({ all: true });
    expect(visibleTheaters(grant({ scope: 'CLUSTER', clusterId: 'hcm', theaterId: null }))).toEqual(
      { all: false, clusterIds: ['hcm'], theaterIds: [] },
    );
    expect(visibleTheaters(grant())).toEqual({ all: false, clusterIds: [], theaterIds: ['q1'] });
    expect(visibleTheaters(grant({ scope: 'SELF', theaterId: null }))).toEqual({
      all: false,
      clusterIds: [],
      theaterIds: [],
    });
  });
});
