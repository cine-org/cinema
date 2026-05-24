# Lefthook

Purpose: local Git hooks.

## Install

```bash
pnpm prepare
```

## Hooks

- `pre-commit`: lint/format staged files and re-stage fixes.
- `commit-msg`: commitlint Conventional Commit check.
- `pre-push`: affected typecheck, test, build.

## Bypass

Use only when you understand the risk:

```bash
git commit --no-verify
git push --no-verify
```

Related: [Commits](../conventions/commits.md)
