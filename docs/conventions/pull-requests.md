# Pull Requests

Purpose: keep review and release flow predictable.

## Title

Normal PRs into `develop` use Conventional Commits:

```text
feat(api): add seat lock command
fix(web-admin): fix runtime config loading
```

Release PRs from `develop` into `main` use:

```text
release: prepare vX.Y.Z
```

Example:

```text
release: prepare v0.1.0
```

## Checklist

- Scope is focused.
- CI passes.
- Tests added or consciously skipped.
- No unrelated refactors.
- Docs updated when behavior or workflow changes.

## Issue Links

Team keywords:

```text
Closes #123
Fixes #456
Refs #789
```

- `Closes`: use for completed feature/task issues.
- `Fixes`: use for bug fixes.
- `Refs`: use for related context that should stay open.

## Targets

- Normal work: PR into `develop`.
- Release checkpoint: PR from `develop` into `main`.

## Workflow Mapping

| PR target          | Workflow                          | Result                            |
| ------------------ | --------------------------------- | --------------------------------- |
| `develop`          | [CI](../workflow/ci.md)           | quality gate before merge         |
| `develop` merge    | [Staging](../workflow/staging.md) | changed apps deploy with `latest` |
| `main`             | [CI](../workflow/ci.md)           | release checkpoint quality gate   |
| after `main` merge | [Release](../workflow/release.md) | manual versioned release          |
| after release      | [Deploy](../workflow/deploy.md)   | manual release deploy             |

PRs do not deploy directly. Deploy happens only after merge through staging or manual release deploy workflows.

## Merge

- Into `develop`: squash merge.
- Into `main`: merge commit.

## Merge Commit Messages

Normal PRs into `develop`:

```text
Merge PR from branch <type>/<issue-number>/<summary> (#<pr-number>)
```

Example:

```text
Merge PR from branch fix/42/runtime-config (#45)
```

Release PRs into `main`:

```text
Merge release: prepare vX.Y.Z (#<pr-number>)
```

Example:

```text
Merge release: prepare v0.1.0 (#45)
```
