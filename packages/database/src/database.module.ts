import {
  DynamicModule,
  Global,
  Module,
  type FactoryProvider,
  type ModuleMetadata,
} from '@nestjs/common';
import { DATABASE_OPTIONS } from './database.constants';
import {
  DatabaseReadClient,
  DatabaseWriteClient,
  type DatabaseClientOptions,
} from './database.client';

export type DatabaseModuleOptions = DatabaseClientOptions & {
  // Read-only connection; falls back to `url` when a setup has no separate reader.
  readonly readUrl?: string;
};

export type DatabaseModuleAsyncOptions<TArgs extends unknown[] = unknown[]> = {
  readonly imports?: ModuleMetadata['imports'];
  readonly inject?: FactoryProvider['inject'];
  readonly useFactory: (...args: TArgs) => DatabaseModuleOptions | Promise<DatabaseModuleOptions>;
};

@Global()
@Module({})
export class DatabaseModule {
  static registerAsync<TArgs extends unknown[] = unknown[]>(
    options: DatabaseModuleAsyncOptions<TArgs>,
  ): DynamicModule {
    return {
      module: DatabaseModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: DATABASE_OPTIONS,
          inject: options.inject ?? [],
          useFactory: options.useFactory,
        },
        {
          provide: DatabaseWriteClient,
          inject: [DATABASE_OPTIONS],
          useFactory: (db: DatabaseModuleOptions) => new DatabaseWriteClient(db),
        },
        {
          provide: DatabaseReadClient,
          inject: [DATABASE_OPTIONS],
          useFactory: ({ readUrl, ...db }: DatabaseModuleOptions) =>
            new DatabaseReadClient({ ...db, url: readUrl ?? db.url }),
        },
      ],
      exports: [DatabaseWriteClient, DatabaseReadClient],
    };
  }
}
