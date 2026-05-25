import type { ApiClient } from './client';
import type { paths } from './generated/openapi/types';

export type HealthResponse =
  paths['/health']['get']['responses'][200]['content']['application/json'];

export type HealthResult = Promise<{
  data?: HealthResponse;
  error?: unknown;
  response: Response;
}>;

export function getHealth(client: ApiClient): HealthResult {
  return client.GET('/health');
}
