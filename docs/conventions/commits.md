# Commits

Purpose: use Conventional Commits consistently.

## Format

```text
<type>(<scope>): <summary>
```

Examples:

```text
feat(api): add user profile endpoint
fix(web-user): fix runtime config fallback
ci: split quality and integration jobs
docs: update deploy artifact flow
```

## Types

- `feat`: user-facing or API feature.
- `fix`: bug fix.
- `refactor`: behavior-preserving code change.
- `test`: tests only.
- `docs`: documentation only.
- `ci`: GitHub Actions and delivery workflows.
- `chore`: maintenance, dependencies, config.
- `build`: build system or packaging.
- `revert`: revert previous commit.

## Breaking Change

```text
feat(api)!: remove deprecated endpoint

BREAKING CHANGE: use /api/v1/users instead.
```

Commit format is checked by Lefthook + commitlint.
