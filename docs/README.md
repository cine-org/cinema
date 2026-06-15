# Docs Index

Purpose: quick context for humans and AI agents working in this repo.

## Read First

- [Architecture](architecture/architecture.md): repo shape, dependency direction, source-of-truth rules.
- [Frontend Structure](apps/frontend-structure.md): Next.js project layout and conventions for web-user and web-admin.
- [Workspace](setup/workspace.md): first local setup.
- [Root Scripts](setup/package-json.md): common commands.
- [Local Testing](tooling/local-testing.md): unit, integration, e2e local flow.
- [CI](workflow/ci.md), [Staging](workflow/staging.md), [Release](workflow/release.md), [Deploy](workflow/deploy.md): delivery lifecycle.

## Repo Areas

- `apps/*`: runnable apps and deployable images.
- `modules/*`: backend business modules imported by apps.
- `packages/*`: shared libraries and generated clients.
- `tooling/*`: shared config packages.
- `infrastructure/*`: Docker, nginx, and VPS deploy scripts.

## Current Delivery Model

```text
PR -> CI
develop push -> staging latest deploy
manual release -> versioned images + GitHub Release
manual deploy -> release artifact deploy
```

Deploys do not git-pull on the VPS. GitHub Actions uploads `deploy-artifact.tar.gz`; the VPS extracts it under `/opt/cinema/releases/<id>` and updates `/opt/cinema/current`.

## Keep Docs Small

Each doc should answer:

- What is this?
- Where is the source of truth?
- What command or file matters?
- What should not be done?
