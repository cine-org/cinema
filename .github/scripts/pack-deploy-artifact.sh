#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:?environment is required}"
OUTPUT="${2:?output path is required}"
shift 2 || true

case "$ENVIRONMENT" in
  staging)
    OVERLAY="compose.staging.yml"
    DEPLOY_SCRIPT="deploy-staging.sh"
    ;;
  production)
    OVERLAY="compose.production.yml"
    DEPLOY_SCRIPT="deploy-production.sh"
    ;;
  *)          echo "Invalid environment: $ENVIRONMENT" >&2; exit 1 ;;
esac

mkdir -p "$(dirname "$OUTPUT")"

tar --exclude='infrastructure/docker/compose.override.yml' \
  --exclude='*/.env.example' \
  -czf "$OUTPUT" \
  infrastructure/docker/compose.yml \
  "infrastructure/docker/$OVERLAY" \
  infrastructure/docker/infra \
  infrastructure/docker/services \
  infrastructure/nginx \
  infrastructure/scripts/deploy-runtime.sh \
  "infrastructure/scripts/$DEPLOY_SCRIPT" \
  "$@"
