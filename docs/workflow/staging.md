# Staging

Purpose: every merge into `main` publishes the changed app images and deploys them to staging.
GitHub Actions never touches the cluster: it opens a PR in `cine-org/cinema-ops`, and Argo CD
deploys what that repo declares.

## Files

```text
.github/workflows/staging.yml
.github/actions/docker-build/       build and push one app image
.github/actions/ops-pr/             set image tags in cinema-ops and open the PR
.github/scripts/detect-changes.sh   which images the merge affects
.github/scripts/wait-for-staging.sh used by the `staging` gate in ci.yml
```

## Flow

```text
merge into main
  └─ staging.yml
       changes ─▶ images (affected apps), tag sha-<7 chars>
       publish ─▶ ghcr.io/cine-org/cinema/<app>:sha-<7>        (one job per app)
       promote ─▶ cinema-release-bot sets newTag in apps/<app>/envs/staging/kustomization.yaml
                  PR "chore(staging): deploy sha-<7>" in cinema-ops, auto-merged once its `ci` passes
                    └─ Argo CD syncs staging ─▶ commit status argocd/staging/<app> on the ops commit
                  waits for success on every promoted app
```

- A manual run (`workflow_dispatch`) has no base commit, so it publishes every app.
- An app with no `apps/<app>/envs/staging` in cinema-ops is published but not promoted; the run
  shows a warning. Add the app in cinema-ops first to deploy it.
- `promote` waits up to 8 minutes for the ops PR to merge (fails if its checks fail or it is
  closed), then up to 10 minutes for Argo CD to post `success` for each promoted app. `failure`
  (sync failed or app degraded) fails the run. Green means the new pods run and pass their probes.
- The status lands on the ops commit Argo CD synced. If another ops commit merges before that
  sync, the status goes to the newer commit and `promote` times out; re-run it.
- Runs never cancel each other (`concurrency: staging`); GitHub keeps only the newest pending run.

## Gate on `main`

The `staging` job in `ci.yml` blocks every `scope/* → main` PR while the last staging run is
running or red, so a broken staging is fixed before more changes land.

## Secrets And Variables

| Name                      | Kind     | Used for                           |
| ------------------------- | -------- | ---------------------------------- |
| `RELEASE_BOT_APP_ID`      | variable | GitHub App token for cinema-ops    |
| `RELEASE_BOT_PRIVATE_KEY` | secret   | same                               |
| `TURBO_TOKEN`             | secret   | Turbo remote cache in image builds |
| `TURBO_TEAM`              | variable | same                               |

Images are pushed with the workflow's own `GITHUB_TOKEN` (`packages: write`).

Related: [CI](ci.md), [Release](release.md), [Rulesets](../conventions/rulesets.md)
