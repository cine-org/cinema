# Pull Requests

Purpose: keep review and history predictable.

## Kinds

| PR                | Base      | Merge        | Issue link  | Body                                       |
| ----------------- | --------- | ------------ | ----------- | ------------------------------------------ |
| work → scope      | `scope/…` | squash       | `Refs #N`   | full: what changed and why                 |
| scope → main      | `main`    | squash       | `Closes #N` | short: the issue outcome, list of work PRs |
| sync main → scope | `scope/…` | merge commit | none        | empty                                      |

Only `scope → main` closes the issue: GitHub closes issues only when a PR lands on `main`. Use
`Fixes #N` instead of `Closes #N` for a bug.

A `scope → main` body does not repeat the work PRs; its Changes section lists them:

```markdown
## Changes

- #50 ci(staging): publish app images and promote them to cinema-ops
```

## Title

Conventional Commits, because the squash commit takes the PR title:

```text
feat(api): add seat lock command
fix(web-admin): fix runtime config loading
```

The `scope → main` title becomes the one commit of the issue on `main`.

## Checklist

- Scope is focused.
- CI passes.
- Tests added or consciously skipped.
- No unrelated refactors.
- Docs updated when behavior or workflow changes.
