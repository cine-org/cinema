#!/usr/bin/env bash
# Sets each app's image tag in apps/<app>/envs/<ENVIRONMENT>/kustomization.yaml and opens a PR.
# Apps without that folder in the ops repo are not deployed there yet: skipped with a warning.
# Runs inside the ops checkout; inputs come as env vars from action.yml.
set -euo pipefail
shopt -s inherit_errexit

branch="promote/$ENVIRONMENT-$TAG"
title="chore($ENVIRONMENT): deploy $TAG"

fail() {
  echo "::error::$1" >&2
  exit 1
}

# Commits show up as the bot account; the email needs the bot's user id, not the app id.
use_bot_identity() {
  local user_id
  user_id="$(gh api "users/$BOT_SLUG%5Bbot%5D" --jq .id)"
  git config user.name "$BOT_SLUG[bot]"
  git config user.email "$user_id+$BOT_SLUG[bot]@users.noreply.github.com"
}

set_image_tag() {
  local file="apps/$1/envs/$ENVIRONMENT/kustomization.yaml"
  local image="$IMAGE_PREFIX/$1"

  [[ -f "$file" ]] || fail "Missing $file in the ops repo."
  IMAGE="$image" yq -e '.images[] | select(.name == strenv(IMAGE))' "$file" >/dev/null ||
    fail "$file has no image named $image."
  IMAGE="$image" yq -i '(.images[] | select(.name == strenv(IMAGE))).newTag = strenv(TAG)' "$file"
}

pr_body() {
  cat <<EOF
Deploy \`$TAG\` to $ENVIRONMENT.

Source: $SOURCE_URL

Apps:
$(printf -- '- %s\n' "${promoted[@]}")
EOF
}

git switch -c "$branch"
promoted=()
for app in $(jq -r '.[]' <<<"$APPS"); do
  if [[ ! -d "apps/$app/envs/$ENVIRONMENT" ]]; then
    echo "::warning::apps/$app/envs/$ENVIRONMENT is not in the ops repo; $app is not promoted."
    continue
  fi
  set_image_tag "$app"
  promoted+=("$app")
done

if ((${#promoted[@]} == 0)); then
  echo "No app of this run is deployed to $ENVIRONMENT; nothing to do."
  exit 0
fi

if git diff --quiet; then
  echo "$ENVIRONMENT already runs $TAG; nothing to do."
  exit 0
fi

use_bot_identity
git commit -am "$title"
# Force: a re-run of the same workflow reuses the branch.
git push --force origin "$branch"

if ! gh pr view "$branch" >/dev/null 2>&1; then
  gh pr create --base main --head "$branch" --title "$title" --body "$(pr_body)"
fi

# Auto-merge returns at once; waiting keeps this job red while the PR is stuck unmerged.
wait_for_merge() {
  local deadline=$((SECONDS + 480)) status
  while ((SECONDS < deadline)); do
    status="$(gh pr view "$branch" --json state,statusCheckRollup --jq '
      if .state == "MERGED" then "merged"
      elif .state == "CLOSED" then "closed"
      elif any(.statusCheckRollup[]; .conclusion == "FAILURE" or .conclusion == "CANCELLED"
        or .conclusion == "TIMED_OUT" or .conclusion == "STARTUP_FAILURE") then "failed"
      else "pending" end')"

    case "$status" in
      merged) echo "Merged $branch." && return ;;
      closed) fail "$branch was closed without merging." ;;
      failed) fail "Checks failed on $branch; see the PR in the ops repo." ;;
    esac
    sleep 15
  done
  fail "$branch did not merge in time; see the PR in the ops repo."
}

# Auto-merge waits for the ops `ci` check; merging right away is refused while it runs.
if [[ "$MERGE" == true ]]; then
  gh pr merge "$branch" --auto --squash --delete-branch
  wait_for_merge
fi
