# Staging

Purpose: auto deploy changed apps from `develop`.

## File

```text
.github/workflows/staging.yml
```

## Trigger

```text
push to develop
manual workflow_dispatch
```

## Flow

```text
detect changed images
build/push changed images: latest + sha-*
pack deploy-artifact.tar.gz
upload artifact to VPS
extract to /opt/cinema/releases/sha-*
current -> releases/sha-*
deploy changed apps with tag latest
```

## Manual Bootstrap

Use manual `deploy_mode=all` when staging is new or GHCR does not have all `:latest` images yet.

```text
deploy_mode=all
  -> build api, scheduler, worker, integration, web-user, web-admin, migrator
  -> deploy all
  -> run migrator before backend services
```

Normal `develop` pushes stay changed-only.

## Changed Detection

Script:

```text
.github/scripts/detect-changes.sh
```

It uses Turbo dry-run to map affected workspaces to image names:

```text
@repo/api -> api
@repo/web-user -> web-user
@repo/database or backend change -> migrator
```

If only `migrator` changed, staging deploys `api` as the backend fallback so migrations run.

## Deploy Artifact

Script:

```text
.github/scripts/pack-deploy-artifact.sh
```

Artifact contains:

```text
infrastructure/docker/
infrastructure/nginx/
infrastructure/scripts/deploy.sh
```

## VPS

Uses GitHub Environment `staging` secrets:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_KEY`
- `GHCR_USER`
- `GHCR_TOKEN`

Deploy command shape:

```bash
bash /opt/cinema/current/infrastructure/scripts/deploy.sh staging --tag latest api web-user
```

Related: [Docker](../infra/docker.md), [Deploy](deploy.md)
