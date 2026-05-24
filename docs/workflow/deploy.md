# Deploy

Purpose: manually deploy a GitHub Release.

## File

```text
.github/workflows/deploy.yml
```

## Trigger

Manual:

```text
tag: vX.Y.Z
```

If `tag` is empty, the latest GitHub Release is deployed.

## Flow

```text
resolve release tag
download release-manifest.yml + deploy-artifact.tar.gz
upload artifact to VPS
extract to /opt/cinema/releases/<tag>
current -> releases/<tag>
deploy all apps from manifest
```

## VPS Layout

```text
/opt/cinema/
  current -> /opt/cinema/releases/v0.3.0
  releases/
    v0.3.0/
      infrastructure/
      release-manifest.yml

/etc/cinema/env/
  docker.env
  shared.env
  api.env
  web-user.env
  web-admin.env
  nginx.env
/etc/cinema/ssl/
```

VPS does not git-pull for deploy.

`nginx.env` provides hostnames for rendered nginx templates:

```env
WEB_HOST=cine.io.vn
ADMIN_HOST=admin.cine.io.vn
API_HOST=api.cine.io.vn
```

## Deploy Command Shape

```bash
bash /opt/cinema/current/infrastructure/scripts/deploy.sh \
  production \
  --manifest /opt/cinema/current/release-manifest.yml \
  all
```

`deploy.sh` generates a temporary compose override and runs `migrator` before backend/all deploys.

## Secrets

GitHub Environment `production` should define:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_KEY`
- `GHCR_USER`
- `GHCR_TOKEN`

Related: [Release](release.md), [Docker](../infra/docker.md)
