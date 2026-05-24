#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   deploy-production.sh --manifest <release-manifest.yml> <app...>
#   app may be one of: api scheduler worker integration web-user web-admin nginx

MODE="${1:-}"
MANIFEST="${2:-}"
shift 2 || true
REQUESTED_APPS=("$@")

REGISTRY="${REGISTRY:-ghcr.io}"
OWNER_NAME="${OWNER_NAME:?OWNER_NAME is required}"
REPO_NAME="${REPO_NAME:?REPO_NAME is required}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/cinema}"
APP_DIR="${APP_DIR:-${DEPLOY_ROOT}/current}"
ENV_DIR="${ENV_DIR:-/etc/cinema/env}"
DEPLOY_ENV=production
COMPOSE_OVERLAY=infrastructure/docker/compose.production.yml

[[ "$MODE" == "--manifest" ]] || { echo "Error: Expected --manifest" >&2; exit 1; }
[[ -f "$MANIFEST" ]] || { echo "Error: Manifest not found: $MANIFEST" >&2; exit 1; }

image_for_service() {
  local service="$1"

  awk -v service="$service" '
    $1 == "images:" { in_images = 1; next }
    in_images && /^[^[:space:]]/ { in_images = 0 }
    in_images {
      key = $1
      sub(/:$/, "", key)
      if (key == service) {
        print $2
        exit
      }
    }
  ' "$MANIFEST"
}

log_start() {
  log "Start production deploy: manifest=$MANIFEST apps=${REQUESTED_APPS[*]}"
}

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=infrastructure/scripts/deploy-runtime.sh
source "$SCRIPT_DIR/deploy-runtime.sh"

log_start
run_deploy
log "Done!"
