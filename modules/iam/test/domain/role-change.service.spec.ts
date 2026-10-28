import { describe, expect, it } from 'vitest';
import {
  assertGrantable,
  assertReplaceable,
  CustomerAccountException,
  LastAdminException,
  NotInternalRoleException,
  RoleScopeMismatchException,
  type GrantPlace,
} from '../../src/domain';

const usher = { scopes: ['THEATER' as const] };
const support = { scopes: ['GLOBAL' as const, 'CLUSTER' as const, 'THEATER' as const] };

const place = (input: Partial<GrantPlace>): GrantPlace => ({
  scope: 'GLOBAL',
  clusterId: null,
  theaterId: null,
  ...input,
});

describe('assertGrantable', () => {
  it('accepts each scope the role allows, pointing at what it names', () => {
    expect(() => assertGrantable(support, place({}))).not.toThrow();
    expect(() =>
      assertGrantable(support, place({ scope: 'CLUSTER', clusterId: 'c1' })),
    ).not.toThrow();
    expect(() =>
      assertGrantable(usher, place({ scope: 'THEATER', theaterId: 't1' })),
    ).not.toThrow();
  });

  it('refuses the customer role', () => {
    expect(() => assertGrantable({ scopes: ['SELF'] }, place({ scope: 'SELF' }))).toThrow(
      NotInternalRoleException,
    );
  });

  it.each([
    ['a scope the role forbids', usher, place({})],
    ['a theater grant without a theater', usher, place({ scope: 'THEATER' })],
    ['a cluster grant without a cluster', support, place({ scope: 'CLUSTER' })],
    [
      'a cluster grant with a theater',
      support,
      place({ scope: 'CLUSTER', clusterId: 'c1', theaterId: 't1' }),
    ],
    [
      'a theater grant with a cluster',
      usher,
      place({ scope: 'THEATER', clusterId: 'c1', theaterId: 't1' }),
    ],
    ['a global grant with a theater', support, place({ theaterId: 't1' })],
  ])('refuses %s', (_, role, target) => {
    expect(() => assertGrantable(role, target)).toThrow(RoleScopeMismatchException);
  });
});

describe('assertReplaceable', () => {
  it('lets an internal role change to another', () => {
    expect(() =>
      assertReplaceable({ roleKey: 'USHER', otherAdmins: null }, 'BOX_OFFICE'),
    ).not.toThrow();
  });

  it('refuses a customer account', () => {
    expect(() => assertReplaceable({ roleKey: 'CUSTOMER', otherAdmins: null }, 'USHER')).toThrow(
      CustomerAccountException,
    );
  });

  it('keeps the last SUPER_ADMIN', () => {
    expect(() => assertReplaceable({ roleKey: 'SUPER_ADMIN', otherAdmins: 0 }, 'USHER')).toThrow(
      LastAdminException,
    );
  });

  it('lets a SUPER_ADMIN go while another stays, or keep the role', () => {
    expect(() =>
      assertReplaceable({ roleKey: 'SUPER_ADMIN', otherAdmins: 1 }, 'USHER'),
    ).not.toThrow();
    expect(() =>
      assertReplaceable({ roleKey: 'SUPER_ADMIN', otherAdmins: 0 }, 'SUPER_ADMIN'),
    ).not.toThrow();
  });
});
