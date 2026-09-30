# Release

Purpose: ship what staging runs to production. A release never rebuilds: the images staging runs get
a version tag, and a PR in `cine-org/cinema-ops` points production at it. Argo CD deploys once a code
owner merges that PR.

## Files

```text
.github/workflows/release.yml
.github/scripts/release-plan.sh     version, images and commit to release
.github/scripts/wait-for-staging.sh the `staging` gate, shared with ci.yml
.github/actions/ops-pr/             set image tags in cinema-ops and open the PR
```

## Flow

```text
Actions → Release → Run workflow (from main, bump patch | minor | major)
  staging ─▶ waits for the last staging run; red fails the release
  plan    ─▶ reads newTag of apps/<app>/envs/staging in cinema-ops → sha-* per app
             version = newest v* tag + bump; commit = newest of those sha-* commits
  retag   ─▶ ghcr.io/cine-org/cinema/<app>:sha-<7> also tagged vX.Y.Z   (one job per app)
  github-release ─▶ cinema-release-bot creates tag vX.Y.Z on that commit + GitHub Release
  promote ─▶ PR "chore(production): deploy vX.Y.Z" in cinema-ops, not merged
                └─ code owner merges ─▶ Argo CD syncs production
                                        ─▶ commit status argocd/production/<app> on the ops commit
```

- Only apps deployed on staging are released; the others show a warning.
- Choosing the bump: `patch` for fixes, `minor` for features, `major` for breaking changes.
- Release notes list the PRs merged since the previous `v*` tag.
- Only `cinema-release-bot` can create `v*` tags (tag ruleset, [Rulesets](../conventions/rulesets.md)).
- Runs never overlap (`concurrency: release`).

## After The Run

1. Open the production PR in cinema-ops and check the tags it sets.
2. Merge it (production files need a `@cine-org/ops` review).
3. Watch `argocd/production/<app>` on the merged ops commit, or the apps in Argo CD.

## Rollback

Open a PR in cinema-ops that sets `newTag` in `apps/<app>/envs/production/kustomization.yaml` back to
the previous `vX.Y.Z`. Images and tags stay in GHCR, so nothing is rebuilt. A database migration is
not rolled back this way: ship a fix forward instead.

## Secrets And Variables

| Name                      | Kind     | Used for                                      |
| ------------------------- | -------- | --------------------------------------------- |
| `RELEASE_BOT_APP_ID`      | variable | GitHub App token: tag, release, cinema-ops PR |
| `RELEASE_BOT_PRIVATE_KEY` | secret   | same                                          |

Images are re-tagged with the workflow's own `GITHUB_TOKEN` (`packages: write`).

Related: [Staging](staging.md), [CI](ci.md)
