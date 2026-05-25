#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   deploy-staging.sh <app...>
#   app may be one of: api scheduler worker integration web-user web-admin nginx

REQUESTED_APPS=("$@")

REGISTRY="${REGISTRY:-ghcr.io}"
OWNER_NAME="${OWNER_NAME:?OWNER_NAME is required}"
REPO_NAME="${REPO_NAME:?REPO_NAME is required}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/cinema}"
APP_DIR="${APP_DIR:-${DEPLOY_ROOT}/current}"
ENV_DIR="${ENV_DIR:-/etc/cinema/env}"
DEPLOY_ENV=staging
IMAGE_TAG=latest
COMPOSE_OVERLAY=infrastructure/docker/compose.staging.yml

image_for_service() {
  local service="$1"

  echo "$REGISTRY/$OWNER_NAME/$REPO_NAME/$service:$IMAGE_TAG"
}

log_start() {
  log "Start staging deploy: tag=$IMAGE_TAG apps=${REQUESTED_APPS[*]}"
}

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=infrastructure/scripts/deploy-runtime.sh
source "$SCRIPT_DIR/deploy-runtime.sh"

log_start
run_deploy
log "Done!"
