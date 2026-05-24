# Issues

Purpose: keep GitHub Issues small enough to become PRs.

## Issue Shape

- Problem or goal.
- Scope and non-goals.
- Acceptance criteria.
- Test notes.
- Target workflow impact when relevant: CI, staging, release, or deploy.

## Labels

- `feature`
- `bug`
- `refactor`
- `infra`
- `docs`
- `chore`

## Priority

- `P0`: blocks deploy or core flow.
- `P1`: important for current sprint.
- `P2`: useful but not blocking.
- `P3`: backlog.

## PR Link

Use these keywords in PR descriptions:

```text
Closes #123
Fixes #456
Refs #789
```

- `Closes`: PR completes the issue or task.
- `Fixes`: PR fixes a bug issue.
- `Refs`: PR is related, but should not close the issue.

Prefer one issue per PR. Use multiple lines when a PR really touches multiple issues:

```text
Closes #123
Refs #130
```

## Workflow Mapping

- Feature/bug/chore issues usually become a PR into `develop`.
- PR into `develop` runs [CI](../workflow/ci.md).
- After merge, `develop` triggers [Staging](../workflow/staging.md).
- Sprint/release checkpoint issues become PRs from `develop` into `main`.
- After `main` merge, [Release](../workflow/release.md) and [Deploy](../workflow/deploy.md) are manual.

## Issue Types And Target

| Issue type | Normal PR target | After merge                               |
| ---------- | ---------------- | ----------------------------------------- |
| Feature    | `develop`        | staging                                   |
| Bug        | `develop`        | staging                                   |
| Refactor   | `develop`        | staging                                   |
| Infra/CI   | `develop`        | staging or workflow only                  |
| Docs       | `develop`        | no deploy unless workflow/infra docs only |
| Release    | `main`           | manual release/deploy                     |
