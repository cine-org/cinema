import {
  DynamicModule,
  Global,
  Module,
  type FactoryProvider,
  type ModuleMetadata,
} from '@nestjs/common';
import { DATABASE_OPTIONS } from './database.constants';
import { DatabaseClient, type DatabaseClientOptions } from './database.client';

export type DatabaseModuleAsyncOptions<TArgs extends unknown[] = unknown[]> = {
  readonly imports?: ModuleMetadata['imports'];
  readonly inject?: FactoryProvider['inject'];
  readonly useFactory: (...args: TArgs) => DatabaseClientOptions | Promise<DatabaseClientOptions>;
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
          provide: DatabaseClient,
          inject: [DATABASE_OPTIONS],
          useFactory: (databaseOptions: DatabaseClientOptions) =>
            new DatabaseClient(databaseOptions),
        },
      ],
      exports: [DatabaseClient],
    };
  }
}
