#!/usr/bin/env bash
set -euo pipefail

TAG="${1:?release tag is required}"
OUTPUT="${2:?output path is required}"

REGISTRY="${REGISTRY:-ghcr.io}"
OWNER_NAME="${OWNER_NAME:?OWNER_NAME is required}"
REPO_NAME="${REPO_NAME:?REPO_NAME is required}"
COMMIT_SHA="${GITHUB_SHA:-$(git rev-parse HEAD)}"

RELEASE_IMAGES=(api scheduler worker integration web-user web-admin migrator)

mkdir -p "$(dirname "$OUTPUT")"

{
  printf 'tag: %s\n' "$TAG"
  printf 'commit: %s\n' "$COMMIT_SHA"
  printf 'registry: %s\n' "$REGISTRY"
  printf 'repository: %s/%s\n' "$OWNER_NAME" "$REPO_NAME"
  printf 'images:\n'

  for index in "${!RELEASE_IMAGES[@]}"; do
    image="${RELEASE_IMAGES[$index]}"
    printf '  %s: %s/%s/%s/%s:%s\n' \
      "$image" "$REGISTRY" "$OWNER_NAME" "$REPO_NAME" "$image" "$TAG"
  done
} > "$OUTPUT"
