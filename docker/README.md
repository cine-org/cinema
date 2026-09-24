# Docker

Local development only. Staging and production run on Kubernetes; their manifests live in the
`cinema-ops` repo, not here.

## Layout

```text
compose.yml       name, volumes, networks, includes
infra/            postgres.yml, redis.yml
apps/             backend.yml (api, worker, scheduler, integration), web.yml
compose.test.yml  test Postgres, a separate stack
```

Volumes and networks are declared in `compose.yml` and referenced by the included files. Anchors
are not: they are file-scoped, so each file carries its own.

## Setup

```bash
cp docker/.env.example docker/.env
pnpm docker:infra
```

`docker:infra` starts Postgres and both Redis instances and waits until they are healthy.

## Database

`DATABASE_URL` uses the superuser; `DATABASE_URL_RO` uses `cinema_ro`, so a write through the read
client fails locally just as on the cluster. Roles live in `infra/postgres/roles.sql`, applied by the
`post_start` hook on every Postgres start (needs Compose 2.30+); edit the file and restart to add one.

## Running the apps

Migrations run from the host against `localhost:5432`, not from a container:

```bash
pnpm db:migrate
```

To exercise the built images instead of `pnpm dev`:

```bash
pnpm docker:build && pnpm docker:apps
```

App services sit behind the `apps` profile, so `pnpm docker:infra` never starts them.

| Script              | Does                               |
| ------------------- | ---------------------------------- |
| `pnpm docker:infra` | Postgres + Redis, wait for healthy |
| `pnpm docker:build` | build every app image              |
| `pnpm docker:apps`  | start the app images               |
| `pnpm docker:logs`  | follow logs                        |
| `pnpm docker:down`  | stop everything, keep volumes      |
| `pnpm docker:reset` | stop everything and drop volumes   |

## Test database

`compose.test.yml` is a separate stack (`cinema-test`: Postgres on 5433, Redis on 6380) used by
`pnpm test:int`, `pnpm test:e2e`, and by CI. Its addresses are what the `.env.test.example` files hold, so
the same values work on a laptop and on a runner:

```bash
pnpm docker:test:up
```

## Ports

| Service         | Port |
| --------------- | ---- |
| postgres        | 5432 |
| postgres (test) | 5433 |
| redis           | 6379 |
| api             | 3000 |
| web-user        | 4000 |
| web-admin       | 4001 |
