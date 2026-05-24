# Branching

Purpose: define how code moves from work branch to staging and release.

## Branches

- `develop`: integration branch. Pushes auto-build and auto-deploy staging.
- `main`: release checkpoint branch. Releases are created manually from `main`.

## Work Branches

```text
<type>/<issue-number>/<short-description>
```

Examples:

```text
feature/12/user-auth
fix/23/login-redirect
ci/25/split-ci-jobs
docs/18/update-workflow-docs
```

## Flow

```text
feature/* -> develop -> main
```

1. Branch from `develop`.
2. PR into `develop`; CI runs.
3. Squash merge into `develop`.
4. `staging.yml` deploys changed apps with `latest`.
5. PR `develop -> main`; CI runs.
6. Merge into `main`.
7. Run `release.yml` manually to create tag, images, and GitHub Release.
8. Run `deploy.yml` manually to deploy a release.

## Merge Policy

- Feature/fix PR to `develop`: squash merge.
- Release PR to `main`: merge commit.

## Release PR Naming

PR title:

```text
release: prepare vX.Y.Z
```

Merge commit:

```text
Merge release: prepare vX.Y.Z (#<pr-number>)
```
