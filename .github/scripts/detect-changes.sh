#!/usr/bin/env bash
set -euo pipefail

##
# Detect which release images have changed using Turborepo's dependency-aware filtering.
#
# Usage:
#   bash detect-changes.sh [base_ref]
#
# Arguments:
#   base_ref - Git ref to compare against (default: HEAD~1)
#
# Output:
#   JSON array of changed image names, e.g. ["api","web-user","migrator"]
#   Also sets GITHUB_OUTPUT if running in GitHub Actions.
#
# How it works:
#   Uses `turbo build --dry-run=json --filter="...[<base_ref>]"` to let Turbo
#   resolve the full dependency graph and report only the packages that are
#   affected by changes since <base_ref>.
##

BASE_REF="${1:-HEAD~1}"

resolve_base_ref() {
  local candidate="$1"

  if [[ -n "$candidate" && ! "$candidate" =~ ^0+$ ]] && git cat-file -e "$candidate^{commit}" 2>/dev/null; then
    echo "$candidate"
    return
  fi

  if git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
    git merge-base HEAD HEAD~1
    return
  fi

  git rev-list --max-parents=0 HEAD
}

BASE_REF="$(resolve_base_ref "$BASE_REF")"

VALID_APPS=("api" "scheduler" "worker" "integration" "web-user" "web-admin")
BACKEND_APPS=("api" "scheduler" "worker" "integration")
ALL_IMAGES=("api" "scheduler" "worker" "integration" "web-user" "web-admin" "migrator")

echo "==> Detecting changes since $BASE_REF using Turborepo..."

TURBO_OUTPUT=$(npx turbo build --dry-run=json --filter="...[${BASE_REF}]" 2>/dev/null)
CHANGED_PACKAGES=$(echo "$TURBO_OUTPUT" | jq -r '.packages[]' 2>/dev/null || true)
CHANGED_FILES=$(git diff --name-only "$BASE_REF"...HEAD 2>/dev/null || git diff --name-only "$BASE_REF" 2>/dev/null || true)

echo "==> Turbo affected packages:"
echo "$CHANGED_PACKAGES"

changed=()

contains_changed() {
  local image="$1"
  local existing

  for existing in "${changed[@]}"; do
    [[ "$existing" == "$image" ]] && return 0
  done

  return 1
}

add_image() {
  local image="$1"

  contains_changed "$image" || changed+=("$image")
}

add_all_images() {
  local image

  for image in "${ALL_IMAGES[@]}"; do
    add_image "$image"
  done
}

add_images_for_file() {
  local file="$1"

  case "$file" in
    .dockerignore | package.json | pnpm-lock.yaml | pnpm-workspace.yaml | turbo.json | .github/actions/docker-build-push/action.yml)
      add_all_images
      ;;
    apps/api/Dockerfile)
      add_image api
      ;;
    apps/scheduler/Dockerfile)
      add_image scheduler
      ;;
    apps/worker/Dockerfile)
      add_image worker
      ;;
    apps/integration/Dockerfile)
      add_image integration
      ;;
    apps/web-user/Dockerfile)
      add_image web-user
      ;;
    apps/web-admin/Dockerfile)
      add_image web-admin
      ;;
    packages/database/migrator/Dockerfile)
      add_image migrator
      ;;
    apps/api/generated/openapi/schema.json)
      add_image web-user
      add_image web-admin
      ;;
    infrastructure/docker/compose.yml | infrastructure/docker/compose.staging.yml | infrastructure/docker/services/* | infrastructure/docker/infra/*)
      add_all_images
      ;;
    infrastructure/nginx/* | infrastructure/scripts/deploy-staging.sh)
      add_image api
      add_image web-user
      add_image web-admin
      ;;
  esac
}

for app in "${VALID_APPS[@]}"; do
  if echo "$CHANGED_PACKAGES" | grep -q "^@repo/${app}$"; then
    add_image "$app"
  fi
done

backend_changed=false
for app in "${BACKEND_APPS[@]}"; do
  if echo "$CHANGED_PACKAGES" | grep -q "^@repo/${app}$"; then
    backend_changed=true
    break
  fi
done

if [[ "$backend_changed" == "true" ]] ||
  echo "$CHANGED_PACKAGES" | grep -q "^@repo/database$" ||
  echo "$CHANGED_FILES" | grep -Eq '^(packages/database/|infrastructure/docker/services/migrator\.yml|packages/database/migrator/)'; then
  add_image migrator
fi

while IFS= read -r file; do
  [[ -n "$file" ]] && add_images_for_file "$file"
done <<< "$CHANGED_FILES"

if [[ ${#changed[@]} -eq 0 ]]; then
  result="[]"
else
  result="["
  for image in "${changed[@]}"; do
    [[ "$result" == "[" ]] || result+=","
    result+="\"$image\""
  done
  result+="]"
fi

echo "==> Changed release images: $result"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "apps=$result" >> "$GITHUB_OUTPUT"
  echo "base=$BASE_REF" >> "$GITHUB_OUTPUT"
fi
