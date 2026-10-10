import type { OpenAPIObject } from '@nestjs/swagger';
import { SURFACE_EXTENSION, type ApiSurface } from '@/common/surface';

type Schemas = NonNullable<NonNullable<OpenAPIObject['components']>['schemas']>;

const SCHEMA_REF = /"#\/components\/schemas\/([^"]+)"/g;
// No route references the error envelope yet, so every doc publishes it.
const ALWAYS_PUBLISHED = ['ErrorResponse'];

// One full document in, one per surface out, each with only the routes and schemas it uses.
export function splitBySurface(document: OpenAPIObject): Record<ApiSurface, OpenAPIObject> {
  return { admin: pick(document, 'admin'), user: pick(document, 'user') };
}

function pick(document: OpenAPIObject, surface: ApiSurface): OpenAPIObject {
  const paths = Object.fromEntries(
    Object.entries(document.paths)
      .map(([path, item]) => [path, keepOperations(path, item, surface)] as const)
      .filter(([, item]) => Object.keys(item).length > 0),
  );

  const all =
    surface === 'user' ? withPlainErrorCode(document) : (document.components?.schemas ?? {});

  // Unreachable schemas would still become SDK types: an admin DTO change must not touch the user SDK.
  const schemas = Object.fromEntries(
    [...reachable(all, paths)].sort().map((name) => [name, all[name]!]),
  );

  return { ...document, paths, components: { ...document.components, schemas } };
}

// The user doc types `code` as a plain string, so the ErrorCode enum (and every new admin code) stays out.
function withPlainErrorCode(document: OpenAPIObject): Schemas {
  const schemas = document.components?.schemas ?? {};
  const errorResponse = schemas.ErrorResponse;

  if (!errorResponse || !('properties' in errorResponse) || !errorResponse.properties?.code) {
    return schemas;
  }

  const code = { type: 'string' as const, example: 'NOT_FOUND' };
  return {
    ...schemas,
    ErrorResponse: { ...errorResponse, properties: { ...errorResponse.properties, code } },
  };
}

function keepOperations(path: string, item: object, surface: ApiSurface): Record<string, object> {
  const kept: Record<string, object> = {};

  for (const [method, operation] of Object.entries(item)) {
    const { [SURFACE_EXTENSION]: owner, ...rest } = operation as Record<string, unknown>;

    // An unmarked route fails generation instead of landing in the wrong doc.
    if (!owner) {
      throw new Error(`${method.toUpperCase()} ${path} has no @AdminApi or @UserApi`);
    }

    if (owner === surface) {
      kept[method] = rest;
    }
  }

  return kept;
}

// Follows $ref chains (a DTO pointing at another DTO) until nothing new turns up.
function reachable(all: Record<string, unknown>, paths: unknown): Set<string> {
  const names = new Set(ALWAYS_PUBLISHED);
  let pending: unknown[] = [paths, ...ALWAYS_PUBLISHED.map((name) => all[name])];

  while (pending.length > 0) {
    const found = [...JSON.stringify(pending).matchAll(SCHEMA_REF)].map(([, name]) => name!);
    const fresh = [...new Set(found)].filter((name) => !names.has(name));

    fresh.forEach((name) => names.add(name));
    pending = fresh.map((name) => all[name]);
  }

  return names;
}
