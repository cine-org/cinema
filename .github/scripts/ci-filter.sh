#!/usr/bin/env bash
set -euo pipefail

base_revision="${1:-${GITHUB_BASE_REF:-}}"

if [[ -z "$base_revision" ]]; then
  echo "Missing base ref for CI filter" >&2
  exit 1
fi

resolve_base_revision() {
  local revision="$1"

  if git rev-parse --verify --quiet "${revision}^{commit}" >/dev/null; then
    printf '%s\n' "$revision"
    return 0
  fi

  if git rev-parse --verify --quiet "origin/${revision}^{commit}" >/dev/null; then
    printf '%s\n' "origin/${revision}"
    return 0
  fi

  echo "Cannot resolve base revision: $revision" >&2
  exit 1
}

is_docs_file() {
  local file="$1"

  case "$file" in
    *.md | LICENSE)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_integration_file() {
  local file="$1"

  case "$file" in
    .github/workflows/ci.yml | \
      .github/actions/** | \
      .github/scripts/** | \
      apps/** | \
      modules/** | \
      packages/** | \
      tooling/** | \
      infrastructure/** | \
      package.json | \
      pnpm-lock.yaml | \
      pnpm-workspace.yaml | \
      turbo.json | \
      tsconfig.json | \
      .env.test.example)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

base_ref="$(resolve_base_revision "$base_revision")"
mapfile -t changed_files < <(git diff --name-only "${base_ref}...HEAD")

quality=false
integration=false

echo "Changed files:"

for file in "${changed_files[@]}"; do
  echo "- $file"

  if is_docs_file "$file"; then
    continue
  fi

  quality=true

  if is_integration_file "$file"; then
    integration=true
  fi
done

echo "quality=$quality"
echo "integration=$integration"

{
  echo "quality=$quality"
  echo "integration=$integration"
} >> "$GITHUB_OUTPUT"
