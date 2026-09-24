# Docs Index

Purpose: quick context for humans and AI agents working in this repo.

## Read First

- [Architecture](architecture/architecture.md): repo shape, dependency direction, source-of-truth rules.
- [Frontend Structure](apps/frontend-structure.md): Next.js project layout and conventions for web-user and web-admin.
- [Workspace](setup/workspace.md): first local setup.
- [Root Scripts](setup/package-json.md): common commands.
- [Local Testing](tooling/local-testing.md): unit, integration, e2e local flow.
- [CI](workflow/ci.md): PR checks.

## Repo Areas

- `apps/*`: runnable apps and deployable images.
- `modules/*`: backend business modules imported by apps.
- `packages/*`: shared libraries and generated clients.
- `tooling/*`: shared config packages.
- `docker/*`: local development containers only.

## Current Delivery Model

```text
<type>/<issue>/<summary> -> main -> staging -> (release) production
```

This repo builds images and opens PRs against `cinema-ops`; Argo CD in each cluster deploys what
`cinema-ops` declares. GitHub Actions never touches a cluster.

## Keep Docs Small

Each doc should answer:

- What is this?
- Where is the source of truth?
- What command or file matters?
- What should not be done?
