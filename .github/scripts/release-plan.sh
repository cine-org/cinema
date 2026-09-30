#!/usr/bin/env bash
# Plans a release from what staging runs: next version, the images to re-tag and the commit to tag.
# Usage: release-plan.sh <patch|minor|major> <ops-dir>. Needs IMAGE_PREFIX, git tags, jq and yq.
set -euo pipefail
shopt -s inherit_errexit

bump="${1:?usage: release-plan.sh <patch|minor|major> <ops-dir>}"
ops_dir="${2:?usage: release-plan.sh <patch|minor|major> <ops-dir>}"

fail() {
  echo "::error::$1" >&2
  exit 1
}

next_version() {
  local latest major minor patch
  latest="$(git tag --list 'v[0-9]*.[0-9]*.[0-9]*' --sort=-v:refname | head -n 1)"
  IFS=. read -r major minor patch <<<"${latest:-v0.0.0}"
  major="${major#v}"

  case "$bump" in
    major) echo "v$((major + 1)).0.0" ;;
    minor) echo "v$major.$((minor + 1)).0" ;;
    patch) echo "v$major.$minor.$((patch + 1))" ;;
    *) fail "Unknown bump '$bump'." ;;
  esac
}

# One {app, tag} per app with a Dockerfile, read from its staging kustomization in the ops repo.
# Apps not deployed on staging are not released: skipped with a warning.
staging_images() {
  local dockerfile app file tag
  for dockerfile in apps/*/Dockerfile; do
    app="$(basename "$(dirname "$dockerfile")")"
    file="$ops_dir/apps/$app/envs/staging/kustomization.yaml"
    if [[ ! -f "$file" ]]; then
      echo "::warning::$app is not deployed on staging; it is not released." >&2
      continue
    fi

    tag="$(IMAGE="$IMAGE_PREFIX/$app" yq '.images[] | select(.name == strenv(IMAGE)) | .newTag' "$file")"
    [[ "$tag" == sha-* ]] || fail "$app runs '$tag' on staging, expected a sha-* tag."

    jq -nc --arg app "$app" --arg tag "$tag" '{app: $app, tag: $tag}'
  done | jq -sc .
}

# Staging tags come from different merges; the newest one describes the whole staging state.
newest_commit() {
  jq -r '.[].tag | ltrimstr("sha-")' <<<"$1" | xargs git rev-list --no-walk | head -n 1
}

version="$(next_version)"
images="$(staging_images)"
[[ "$images" != "[]" ]] || fail "No app is deployed on staging; nothing to release."
commit="$(newest_commit "$images")"
apps="$(jq -c 'map(.app)' <<<"$images")"

echo "version=$version"
echo "commit=$commit"
echo "images=$images"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  printf 'version=%s\ncommit=%s\nimages=%s\napps=%s\n' "$version" "$commit" "$images" "$apps" >>"$GITHUB_OUTPUT"
fi
