# Pull Requests

Purpose: keep review and history predictable.

## Title

Conventional Commits, because the squash commit on `main` takes the PR title:

```text
feat(api): add seat lock command
fix(web-admin): fix runtime config loading
```

## Checklist

- Scope is focused.
- CI passes.
- Tests added or consciously skipped.
- No unrelated refactors.
- Docs updated when behavior or workflow changes.

## Issue Links

```text
Closes #123
Fixes #456
Refs #789
```

- `Closes`: completed feature/task issues.
- `Fixes`: bug fixes.
- `Refs`: related context that should stay open.

## Merge

Squash merge into `main`. The ruleset requires the `ci` check.
