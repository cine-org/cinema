import { RequestMethod, VersioningType, type INestApplication } from '@nestjs/common';

// Constants, not env: the generated api-client bakes these into every path.
export const API_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';

export function setupHttp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX, {
    exclude: [{ path: 'health', method: RequestMethod.ALL }],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_DEFAULT_VERSION,
  });
}
