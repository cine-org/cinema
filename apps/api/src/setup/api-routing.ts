import { INestApplication, RequestMethod, VersioningType } from '@nestjs/common';

export type ApiRoutingOptions = {
  readonly apiPrefix: string;
  readonly enableVersioning?: boolean;
};

export function setupApiRouting({
  app,
  apiPrefix,
  enableVersioning = true,
}: ApiRoutingOptions & { readonly app: INestApplication }) {
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      {
        path: 'health',
        method: RequestMethod.ALL,
      },
    ],
  });

  if (enableVersioning) {
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
  }

  return {
    apiPrefix,
    enableVersioning,
  };
}
