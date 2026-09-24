# Branching

Purpose: define how code moves from a work branch to `main`.

## Branches

- `main`: the only long-lived branch. Every change reaches it through a PR.

## Work Branches

```text
<type>/<issue-number>/<short-description>
```

Examples:

```text
feat/12/user-auth
fix/23/login-redirect
ci/26/ci-gate-trunk-flow
refactor/27/backend-foundation
```

`<type>` is a commit type from [Commits](commits.md).

## Flow

```text
<type>/<issue>/<summary> -> main
```

1. Branch from `main`.
2. Open a PR into `main`; [CI](../workflow/ci.md) runs.
3. Squash merge once `ci` is green.

A branch that builds on an unmerged one branches from it, then moves onto `main` after the first
merges (squash changes its commits):

```bash
git rebase --onto origin/main <first-branch> <second-branch>
```
