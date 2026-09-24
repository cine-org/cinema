# Issues

Purpose: keep GitHub Issues small enough to become PRs.

## Issue Shape

- Problem or goal.
- Scope and non-goals.
- Acceptance criteria.
- Test notes.
- Target workflow impact when relevant: CI or delivery.

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

## Workflow

Every issue becomes a PR into `main`, gated by [CI](../workflow/ci.md).
