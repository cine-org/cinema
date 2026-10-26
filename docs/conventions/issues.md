# Issues

Purpose: keep GitHub Issues small enough to become scopes, and grouped so a feature's whole life is
readable on the project board.

## Title

`[<Component>] <Type>: <summary>`, for example `[Theater] Feat: theaters admin pages (mock)`.

- `<Type>`: `Feat`, `Bug` or `Task`. It matches the GitHub Issue Type of the issue.
- `<Component>` says why the work exists, not which files it touches. A movies page is `[Movie]`,
  not `[Web]`. It is also the `Component` field on the project board, one value per issue.
- A change that must land together across components stays one issue. Up to two tags are allowed
  (`[Booking][Promo]`); the first one is the board Component.

| Group                 | Components                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Platform              | `Ops` (repo `cinema-ops` only), `Infra` (monorepo, tooling, local docker, conventions), `CI`, `Monitor`, `API` and `Web` (code shared by many features only) |
| People                | `Auth` (who you are), `IAM` (what you may do), `User` (customer and employee accounts)                                                                       |
| Catalog               | `Theater`, `Movie`, `Showtime`                                                                                                                               |
| Sales                 | `Booking`, `Order`, `Payment`, `Ticket`, `Counter`                                                                                                           |
| Growth and operations | `Promo`, `Loyalty`, `Notify`, `Report`, `Audit`                                                                                                              |

Add a component when a new part of the system appears; rename or merge one by editing the board
field, not the structure.

## Kinds Of Work

A component never closes. Work inside it comes in a few kinds.

| Kind                 | How                                                                                                                                        | Closes when                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Core                 | parent `[<Component>] Feat: <name> core` with sub-issues                                                                                   | usable: api, admin, user side where it applies, running on staging |
| Upgrade              | a new parent, for example `[Theater] Feat: seat layout v2`                                                                                 | that round is done                                                 |
| Maintenance          | a single issue, `Bug` or `Task`, no parent                                                                                                 | that issue is done                                                 |
| Spike                | a single `Task` that ends in an answer                                                                                                     | the conclusion is written in a comment or in docs                  |
| Refactor / tech debt | single when small; a parent as an upgrade when large                                                                                       | the work is done                                                   |
| Cross-cutting        | a parent whose component is the shared goal (`Audit` for audit logs everywhere); each child carries the component of the module it changes | all children are done                                              |
| Production incident  | a single `Bug`, Priority `P0`                                                                                                              | the fix reaches production                                         |

- The children of a parent are free: split by layer (module, api, mock, wiring) or as end-to-end
  slices, whichever suits the person doing the work. Only the parent's "done" is fixed.
- A parent is one round of work with an end. Write what "done" means in its Acceptance Criteria.
  Do not keep one parent open forever: the progress bar stops meaning anything.
- Found a problem in another feature while working? Open an issue under that feature's component
  and mark the dependency with "blocked by". Do not keep your own parent open for it.
- No issue needed: small docs fixes (they ride along in another PR), release PRs, a single
  dependency bump.

## Issue Shape

- Goal: the outcome in one or two sentences.
- Scope and non-goals.
- Acceptance criteria.
- Test notes.
- Target workflow impact when relevant: CI or delivery.

Body templates are in `.github/ISSUE_TEMPLATE/`. One leaf issue is one sizeable block that ends in
one scope; do not split it into tiny issues.

## Labels And Fields

- Labels describe layer and environment only: `backend`, `frontend`, `database`, `devops`, `docs`,
  `security`, `staging`, `production`.
- Type, Component, Priority and Status are board and issue fields, not labels.
- Every issue is on the project board with a Component and a Type.

| Priority | Meaning                      |
| -------- | ---------------------------- |
| `P0`     | blocks deploy or a core flow |
| `P1`     | important now                |
| `P2`     | useful but not blocking      |
| `P3`     | backlog                      |

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

Only the `scope → main` PR closes an issue; work PRs into a scope use `Refs`. GitHub does not close
a parent when its sub-issues finish: close it by hand once its criteria are met.

## Workflow

Every leaf issue becomes a scope branch and lands in `main` through one PR, gated by
[CI](../workflow/ci.md). See [Branching](branching.md).
