import { SetMetadata } from '@nestjs/common';
import { getSchemaPath } from '@nestjs/swagger';

export const RESPONSE_ENVELOPE = Symbol('RESPONSE_ENVELOPE');

// How the interceptor shapes a route's result; routes without metadata get `success`.
export type ResponseEnvelope = 'success' | 'paginated' | 'raw';

export const ResponseEnvelope = (envelope: ResponseEnvelope) =>
  SetMetadata(RESPONSE_ENVELOPE, envelope);

// Opts a route or controller out of the envelope (health probes, files, redirects).
export const RawResponse = () => ResponseEnvelope('raw');

// Envelope classes have private constructors, so take what getSchemaPath accepts, not `Type`.
type SchemaModel = Parameters<typeof getSchemaPath>[0];

// OpenAPI for `Envelope & { data }`: the envelope class plus the route's own data schema.
export function envelopeSchema(envelope: SchemaModel, data: object) {
  return {
    allOf: [
      { $ref: getSchemaPath(envelope) },
      { type: 'object', required: ['data'], properties: { data } },
    ],
  };
}

export function listOf(dto: SchemaModel) {
  return { type: 'array', items: { $ref: getSchemaPath(dto) } };
}
