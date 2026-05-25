# Release

Purpose: create a versioned system release from `main`.

## File

```text
.github/workflows/release.yml
```

## Trigger

Manual:

```text
bump: major | minor | patch
```

## Flow

```text
checkout main
calculate next git tag
build/push all images with release tag + sha-*
create git tag
write release-manifest.yml
pack deploy-artifact.tar.gz
create GitHub Release
attach manifest + artifact
```

## Versioning

Version source of truth is the Git tag:

```text
v0.3.0
```

`package.json` version is not used for release versioning.

## Release Manifest

`release-manifest.yml` maps every service to an exact image:

```yaml
tag: v0.3.0
commit: abc123
images:
  api: ghcr.io/org/repo/api:v0.3.0
  web-user: ghcr.io/org/repo/web-user:v0.3.0
  migrator: ghcr.io/org/repo/migrator:v0.3.0
```

Production deploy reads image names from this file.

## Deploy Artifact

`deploy-artifact.tar.gz` contains the deploy runtime files:

```text
infrastructure/docker/
infrastructure/nginx/
infrastructure/scripts/deploy.sh
release-manifest.yml
```

Release does not deploy.

Related: [Deploy](deploy.md)
