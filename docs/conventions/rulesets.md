# Rulesets

Purpose: the GitHub settings that enforce the branch flow and releases.

Source of truth is **Settings → Rules → Rulesets** on GitHub. This page describes each ruleset;
rebuild them from the tables below and update this page in a PR when a ruleset changes.

```text
<type>/<issue>/* ──PR, squash──▶ scope/<issue>/* ──PR, squash──▶ main ──▶ staging
                                      ▲                                   │
                                      └──── PR main → scope, merge ───────┘   (sync)
release.yml (bot) ──▶ tag v* ──▶ production PR in cinema-ops
```

## Repo Settings (Settings → General)

| Setting                            | Value        |
| ---------------------------------- | ------------ |
| Default branch                     | `main`       |
| Allow merge commits                | on, PR title |
| Allow squash merging               | on, PR title |
| Allow rebase merging               | off          |
| Automatically delete head branches | on           |

Both merge methods stay on at repo level; each ruleset narrows them.

## `main`

Only the rules below are on; everything else is off.

| Rule                        | Value  | Why                                                      |
| --------------------------- | ------ | -------------------------------------------------------- |
| Bypass list                 | empty  |                                                          |
| Restrict deletions          | on     |                                                          |
| Block force pushes          | on     |                                                          |
| Require pull request        | on     |                                                          |
| ↳ Required approvals        | 1      | 0 when working alone: GitHub never lets you self-approve |
| ↳ Dismiss stale approvals   | on     |                                                          |
| ↳ Most recent push approval | on     |                                                          |
| ↳ Conversation resolution   | on     |                                                          |
| ↳ Allowed merge methods     | squash | one commit per issue on `main`                           |
| Required status checks      | `ci`   | the gate job of `ci.yml`; adding jobs needs no change    |
| ↳ Branches up to date       | on     | a scope must sync `main` before it merges                |

## `scope/*`

Same as `main`, except:

| Rule                  | Value         | Why                                                      |
| --------------------- | ------------- | -------------------------------------------------------- |
| Restrict deletions    | off           | merged scopes get deleted                                |
| Allowed merge methods | squash, merge | squash for work PRs, merge commit for the `main` sync PR |
| Branches up to date   | off           | work branches start from the scope                       |

"Update branch" on a `scope → main` PR is blocked (it pushes to the scope). Sync with a PR
`main → scope/*` instead.

## `v*` tags

| Rule               | Value                        | Why                                           |
| ------------------ | ---------------------------- | --------------------------------------------- |
| Bypass list        | `cinema-release-bot`, always | only `release.yml` creates release tags       |
| Restrict creations | on                           | every `v*` tag has re-tagged images behind it |
| Restrict updates   | on                           | a release never moves                         |
| Restrict deletions | on                           |                                               |

## Release Bot

`cinema-release-bot` (GitHub App, installed on `cinema` and `cinema-ops`) creates `v*` tags here
and opens PRs in `cinema-ops`. Workflows use variable `RELEASE_BOT_APP_ID` and secret
`RELEASE_BOT_PRIVATE_KEY`. Its rulesets and permissions on the ops side live in `cinema-ops`.
