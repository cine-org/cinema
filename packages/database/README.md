# Database

`@repo/database` owns the generated Prisma client and the PostgreSQL adapter used by backend
applications.

## Direct Client

```ts
import { createDatabaseClient } from '@repo/database';

const database = createDatabaseClient({
  url: process.env.DATABASE_URL!,
  maxConnections: 10,
  idleTimeoutMs: 30_000,
  connectionTimeoutMs: 5_000,
});

await database.$connect();

try {
  // Run short-lived database work.
} finally {
  await database.$disconnect();
}
```

Pool settings are optional. When omitted, the underlying `pg` pool defaults apply.

## NestJS

```ts
DatabaseModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    url: config.db.url,
  }),
});
```

`DatabaseModule` is global and exports `DatabaseClient`. The client connects and disconnects
through NestJS module lifecycle hooks.

## Prisma Commands

Run commands from the repository root:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:deploy
pnpm db:seed
pnpm db:studio
```

Use `db:migrate` only for development and `db:deploy` for committed migrations in deployed
environments. Do not use `db:push` in production.
