#!/usr/bin/env bash
# Finds what changed since a base commit: whether code changed, and which app images are affected.
# Usage: detect-changes.sh [base-sha]. Prints code= and images= (also to $GITHUB_OUTPUT). Needs jq and pnpm install.
set -euo pipefail
shopt -s inherit_errexit

base="${1:-}"

docs='.*\.md|LICENSE'
# Root files copied into every image although they belong to no package.
root_build_files='package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json|\.dockerignore'
# Web apps read it through @repo/api-client, which Turbo does not link to @repo/api.
openapi_schema='apps/api/generated/openapi/schema\.json'

# Empty (manual run), all-zero (new branch) or unknown SHAs cannot be diffed against.
has_base() {
  [[ -n "$base" && ! "$base" =~ ^0+$ ]] && git cat-file -e "$base^{commit}" 2>/dev/null
}

# Every app with a Dockerfile ships as an image.
all_apps() {
  local dockerfile
  for dockerfile in apps/*/Dockerfile; do
    basename "$(dirname "$dockerfile")"
  done
}

# Changed packages plus everything depending on them.
affected_packages() {
  pnpm exec turbo run build --dry-run=json --filter="...[$base]" | jq -r '.packages[]'
}

# One app per line, may repeat.
affected_apps() {
  if grep -qxE "$root_build_files" <<<"$files"; then
    all_apps
    return
  fi

  local packages app
  packages="$(affected_packages)"
  for app in $(all_apps); do
    if grep -qx "@repo/$app" <<<"$packages"; then
      echo "$app"
    fi
  done

  if grep -qxE "$openapi_schema" <<<"$files"; then
    printf '%s\n' web-user web-admin
  fi
}

# Lines in, sorted unique JSON array out.
to_json_array() {
  jq -Rnc '[inputs | select(. != "")] | unique'
}

code=false
images='[]'

if has_base; then
  files="$(git diff --name-only "$base"...HEAD)"
  printf 'Changed since %s:\n%s\n' "$base" "$files"

  if [[ -n "$files" ]] && grep -qvxE "$docs" <<<"$files"; then
    code=true
    images="$(affected_apps | to_json_array)"
  fi
else
  echo "No usable base '$base': everything counts as changed."
  code=true
  images="$(all_apps | to_json_array)"
fi

echo "code=$code"
echo "images=$images"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  printf 'code=%s\nimages=%s\n' "$code" "$images" >>"$GITHUB_OUTPUT"
fi
