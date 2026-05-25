# CI

Purpose: PR quality gate. No deploys.

## File

```text
.github/workflows/ci.yml
```

## Trigger

PR into:

- `develop`
- `main`

## Jobs

- `filter`: skips CI when only docs/non-code files changed.
- `quality`: lint, typecheck, unit tests, coverage.
- `integration`: Postgres/Redis services, test migrations, integration, e2e.

## Scripts

```text
.github/scripts/ci-quality.sh
.github/scripts/ci-integration.sh
.github/scripts/ci-prepare.sh
```

## Notes

- CI writes `.env.test`.
- DB services run only for the integration job.
- CI does not build Docker images.
- CI does not deploy or smoke-test deployed URLs.

Related: [Local Testing](../tooling/local-testing.md)
