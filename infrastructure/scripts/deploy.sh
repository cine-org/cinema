#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   deploy.sh <environment> --tag <tag> <app...>
#   deploy.sh <environment> --manifest <release-manifest.yml> all
#   app may be one of: api scheduler worker integration web-user web-admin nginx
#
# Runtime layout:
#   DEPLOY_ROOT=/opt/cinema
#   APP_DIR=/opt/cinema/current

ENVIRONMENT="${1:-}"
MODE="${2:-}"
VALUE="${3:-}"
shift 3 || true
REQUESTED_APPS=("$@")

REGISTRY="${REGISTRY:-ghcr.io}"
OWNER_NAME="${OWNER_NAME:?OWNER_NAME is required}"
REPO_NAME="${REPO_NAME:?REPO_NAME is required}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/cinema}"
APP_DIR="${APP_DIR:-${DEPLOY_ROOT}/current}"
ENV_DIR="${ENV_DIR:-/etc/cinema/env}"

IMAGE_APPS=(api scheduler worker integration web-user web-admin)
PUBLIC_APPS=("${IMAGE_APPS[@]}" nginx)
BACKEND_APPS=(api scheduler worker integration)
COMPOSE_IMAGE_SERVICES=("${IMAGE_APPS[@]}" migrator)

COMPOSE_OPTS=(--env-file "${ENV_DIR}/docker.env")
COMPOSE_FILES=(-f infrastructure/docker/compose.yml)
COMPOSE_OVERRIDE=infrastructure/docker/override.yml

TARGET_APPS=()
IMAGE_SERVICES=()

log() { echo "[$(date +'%H:%M:%S')] $*"; }

die() { echo "Error: $*" >&2; exit 1; }

compose() { docker compose "${COMPOSE_OPTS[@]}" "${COMPOSE_FILES[@]}" "$@"; }

contains() {
  local item="$1"
  shift

  [[ " $* " =~ " $item " ]]
}

append_unique() {
  local -n arr="$1"
  local item="$2"

  contains "$item" "${arr[@]}" || arr+=("$item")
}

image_for_tag() {
  local service="$1"
  local tag="$2"

  echo "$REGISTRY/$OWNER_NAME/$REPO_NAME/$service:$tag"
}

image_for_manifest() {
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
  ' "$VALUE"
}

image_for_service() {
  local service="$1"

  case "$MODE" in
    --tag)      image_for_tag "$service" "$VALUE" ;;
    --manifest) image_for_manifest "$service" ;;
    *)          die "Invalid deploy mode: $MODE" ;;
  esac
}

validate_args() {
  [[ "$ENVIRONMENT" == "staging" || "$ENVIRONMENT" == "production" ]] \
    || die "Invalid environment: $ENVIRONMENT"

  [[ "$MODE" == "--tag" || "$MODE" == "--manifest" ]] \
    || die "Expected --tag or --manifest"

  [[ -n "$VALUE" ]] || die "Tag or manifest path is required"
  [[ ${#REQUESTED_APPS[@]} -gt 0 ]] || die "At least one app is required"

  if [[ "$MODE" == "--tag" ]]; then
    [[ "$VALUE" =~ ^(latest|v[0-9]+\.[0-9]+\.[0-9]+|sha-[a-f0-9]+)$ ]] \
      || die "Invalid tag: $VALUE"

    [[ "$ENVIRONMENT" != "production" || "$VALUE" != "latest" ]] \
      || die "Production deploy cannot use latest"
  else
    [[ -f "$VALUE" ]] || die "Manifest not found: $VALUE"
  fi
}

normalize_target_apps() {
  local app

  for app in "${REQUESTED_APPS[@]}"; do
    if [[ "$app" == "all" ]]; then
      TARGET_APPS=("${PUBLIC_APPS[@]}")
      return
    fi
  done

  for app in "${REQUESTED_APPS[@]}"; do
    contains "$app" "${PUBLIC_APPS[@]}" || die "Invalid app: $app"
    append_unique TARGET_APPS "$app"
  done
}

should_run_migrations() {
  local app

  for app in "${TARGET_APPS[@]}"; do
    if contains "$app" "${BACKEND_APPS[@]}"; then
      return 0
    fi
  done

  return 1
}

resolve_image_services() {
  local app

  for app in "${TARGET_APPS[@]}"; do
    contains "$app" "${IMAGE_APPS[@]}" && append_unique IMAGE_SERVICES "$app"
  done

  if should_run_migrations; then
    append_unique IMAGE_SERVICES migrator
  fi
}

overlay_for_environment() {
  case "$ENVIRONMENT" in
    staging)    echo infrastructure/docker/compose.staging.yml ;;
    production) echo infrastructure/docker/compose.production.yml ;;
  esac
}

validate_image_exists() {
  local service="$1"
  local image; image="$(image_for_service "$service")"

  [[ -n "$image" ]] || die "Image for $service not found"

  log "Check image: $image"
  docker manifest inspect "$image" >/dev/null 2>&1 || die "Image not found: $image"
}

generate_override() {
  local service image

  log "Generate override"
  {
    printf 'services:\n'
    for service in "${COMPOSE_IMAGE_SERVICES[@]}"; do
      image="$(image_for_service "$service")"
      [[ -n "$image" ]] || die "Image for $service not found"
      printf '  %s:\n    image: %s\n' "$service" "$image"
    done
  } > "$COMPOSE_OVERRIDE"
}

prepare_images() {
  local service

  for service in "${IMAGE_SERVICES[@]}"; do
    validate_image_exists "$service"
  done

  generate_override
}

run_database_migrations() {
  local overlay="$1"

  should_run_migrations || return 0

  log "Ensure database dependencies..."
  compose -f "$overlay" -f "$COMPOSE_OVERRIDE" up -d postgres redis

  log "Run database migrations..."
  compose -f "$overlay" -f "$COMPOSE_OVERRIDE" run --rm migrator
}

should_reload_nginx() {
  local app

  contains nginx "${TARGET_APPS[@]}" && return 1

  for app in "${TARGET_APPS[@]}"; do
    [[ "$app" == "api" || "$app" == "web-user" || "$app" == "web-admin" ]] && return 0
  done

  return 1
}

reload_nginx() {
  should_reload_nginx || return 0

  if docker ps --format '{{.Names}}' | grep -qx 'cinema-nginx-1'; then
    log "Reload nginx..."
    docker exec cinema-nginx-1 nginx -s reload || log "Warning: nginx reload failed"
  else
    log "Skip nginx reload: container not running"
  fi
}

deploy() {
  local overlay; overlay="$(overlay_for_environment)"

  log "Deploy ${TARGET_APPS[*]} ($ENVIRONMENT)"

  prepare_images

  compose -f "$overlay" -f "$COMPOSE_OVERRIDE" pull "${IMAGE_SERVICES[@]}"
  run_database_migrations "$overlay"
  compose -f "$overlay" -f "$COMPOSE_OVERRIDE" up -d --no-build --remove-orphans "${TARGET_APPS[@]}"
}

main() {
  log "Start deploy: env=$ENVIRONMENT mode=$MODE value=$VALUE apps=${REQUESTED_APPS[*]}"

  mkdir -p "$APP_DIR"
  cd "$APP_DIR"

  validate_args
  [[ -f "infrastructure/docker/compose.yml" ]] || die "compose.yml not found"

  : "${GHCR_USER:?GHCR_USER is required}"
  : "${GHCR_TOKEN:?GHCR_TOKEN is required}"

  echo "$GHCR_TOKEN" | docker login "$REGISTRY" -u "$GHCR_USER" --password-stdin

  normalize_target_apps
  resolve_image_services
  deploy
  reload_nginx

  log "Done!"
}

trap 'rm -f "$COMPOSE_OVERRIDE"' EXIT

main "$@"
