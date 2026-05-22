#!/usr/bin/env bash
set -euo pipefail

OUTPUT="${1:?output path is required}"
shift || true

mkdir -p "$(dirname "$OUTPUT")"

tar --exclude='infrastructure/docker/override.yml' \
  -czf "$OUTPUT" \
  infrastructure/docker \
  infrastructure/nginx \
  infrastructure/scripts/deploy.sh \
  "$@"
