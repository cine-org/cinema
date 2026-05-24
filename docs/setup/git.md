# Git Setup

Purpose: local Git behavior and hooks.

## Hooks

Lefthook installs via:

```bash
pnpm prepare
```

Hooks:

- `pre-commit`: lint/format staged files.
- `commit-msg`: validate Conventional Commit format.
- `pre-push`: run affected typecheck/test/build.

Emergency bypass:

```bash
git commit --no-verify
git push --no-verify
```

## Repo Files

- `.gitignore`: ignores env, generated, build, cache, coverage, dependencies.
- `.gitattributes`: normalizes text files to LF.
- `.editorconfig`: common indentation and newline rules.

Related: [Commits](../conventions/commits.md), [Branching](../conventions/branching.md)
