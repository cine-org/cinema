# Branching

Purpose: define how code moves from a work branch to `main`.

## Branches

| Branch                     | Lives                 | Created from | Merges into        |
| -------------------------- | --------------------- | ------------ | ------------------ |
| `main`                     | always                |              |                    |
| `scope/<issue>/<summary>`  | one issue             | `main`       | `main` (squash)    |
| `<type>/<issue>/<summary>` | one piece of an issue | the scope    | the scope (squash) |

`main` and `scope/*` are protected ([Rulesets](rulesets.md)): only PRs, never direct pushes.
`<type>` is a commit type from [Commits](commits.md). Examples: `scope/28/staging-delivery`,
`ci/28/staging-delivery`, `feat/31/seat-lock`.

## Flow

```text
<type>/<issue>/<summary> ──PR, squash──▶ scope/<issue>/<summary> ──PR, squash──▶ main ──▶ staging
                                              ▲                                      │
                                              └──── PR main → scope, merge commit ───┘   (sync)
```

1. Create the scope from the latest `main`:
   `git push origin origin/main:refs/heads/scope/<issue>/<summary>`.
2. Branch work from the scope; open PRs into the scope. Each one squashes into one commit there.
3. When the issue is done, open `scope → main`. It squashes into one commit on `main`, and the
   merge publishes and deploys to [Staging](../workflow/staging.md).
4. If `main` moved meanwhile, sync with a PR `main → scope` merged as a **merge commit**.
   "Update branch" on a `scope → main` PR is blocked: it would push to the scope.

One issue is one scope. A PR into `main` from anything but `scope/*` fails `ci` (`branch` job),
and so does any PR into `main` while the last staging run is red (`staging` job).

A branch that builds on an unmerged one branches from it, then moves onto the scope after the first
merges (squash changes its commits):

```bash
git rebase --onto origin/scope/<issue>/<summary> <first-branch> <second-branch>
```
