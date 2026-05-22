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

echo "==> Detecting changes since $BASE_REF using Turborepo..."

TURBO_OUTPUT=$(npx turbo build --dry-run=json --filter="...[${BASE_REF}]" 2>/dev/null)
CHANGED_PACKAGES=$(echo "$TURBO_OUTPUT" | jq -r '.packages[]' 2>/dev/null || true)
CHANGED_FILES=$(git diff --name-only "$BASE_REF"...HEAD 2>/dev/null || git diff --name-only "$BASE_REF" 2>/dev/null || true)

echo "==> Turbo affected packages:"
echo "$CHANGED_PACKAGES"

changed=()

for app in "${VALID_APPS[@]}"; do
  if echo "$CHANGED_PACKAGES" | grep -q "^@repo/${app}$"; then
    changed+=("\"$app\"")
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
  changed+=("\"migrator\"")
fi

if [[ ${#changed[@]} -eq 0 ]]; then
  result="[]"
else
  result="[$(IFS=,; echo "${changed[*]}")]"
fi

echo "==> Changed release images: $result"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "apps=$result" >> "$GITHUB_OUTPUT"
  echo "base=$BASE_REF" >> "$GITHUB_OUTPUT"
fi
