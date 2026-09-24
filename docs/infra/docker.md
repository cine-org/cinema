# Docker

Purpose: local development containers. Staging and production are Kubernetes and live in the
`cinema-ops` repo.

## Files

```text
docker/
  compose.yml       name, volumes, networks, includes
  infra/            postgres.yml, redis.yml
  apps/             backend.yml (api, worker, scheduler, integration), web.yml
  compose.test.yml  separate Postgres for integration/e2e tests
  .env              compose variables (gitignored)
```

No env overlays: there is only one environment left here. `docker/` sits at the repo root because
it is all that remained of `infrastructure/`.

Services are grouped, not split one file per service, because YAML anchors are file-scoped and do
not cross `include:`. Splitting `api`, `worker`, `scheduler` and `integration` into four files would
mean copying their shared environment and `depends_on` block four times, which is exactly what the
`x-backend` anchor exists to avoid.

## Shape

Infra services start by default. App services sit behind the `apps` profile, so `pnpm docker:infra`
brings up Postgres and Redis without building any image.

There is no PgBouncer and no migrator container. Pooling is the cluster's job (CNPG pooler), and
migrations run from the host with `pnpm db:migrate` against `localhost:5432`.

## Database

Writes and migrations use the superuser; reads use `cinema_ro` (`pg_read_all_data`), from
`docker/infra/postgres/roles.sql`, which a `post_start` hook applies on every Postgres start. A write through the read client fails locally, as it does on the
cluster with its CNPG `managed.roles`.

Commands and ports: [docker/README.md](../../docker/README.md)
