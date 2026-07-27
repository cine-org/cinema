#!/usr/bin/env bash
set -euo pipefail

IMAGE_APPS=(api scheduler worker integration web-user web-admin)
PUBLIC_APPS=("${IMAGE_APPS[@]}" nginx)
BACKEND_APPS=(api scheduler worker integration)
COMPOSE_IMAGE_SERVICES=("${IMAGE_APPS[@]}" migrator)

COMPOSE_OPTS=(--env-file "${ENV_DIR}/docker.env")
COMPOSE_FILES=(-f infrastructure/docker/compose.yml)
COMPOSE_OVERRIDE=infrastructure/docker/compose.override.yml

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
  should_run_migrations || return 0

  log "Ensure database dependencies..."
  compose -f "$COMPOSE_OVERLAY" -f "$COMPOSE_OVERRIDE" up -d postgres

  log "Provision database roles and base privileges..."
  compose -f "$COMPOSE_OVERLAY" -f "$COMPOSE_OVERRIDE" run --rm --no-deps db-provisioner prepare

  log "Run database migrations..."
  compose -f "$COMPOSE_OVERLAY" -f "$COMPOSE_OVERRIDE" run --rm --no-deps migrator

  log "Reconcile and verify runtime database privileges..."
  compose -f "$COMPOSE_OVERLAY" -f "$COMPOSE_OVERRIDE" run --rm --no-deps db-access-reconciler reconcile

  log "Ensure PgBouncer..."
  compose -f "$COMPOSE_OVERLAY" -f "$COMPOSE_OVERRIDE" up -d --wait --no-deps pgbouncer
}

target_has_nginx() {
  contains nginx "${TARGET_APPS[@]}"
}

target_has_public_app() {
  local app

  for app in "${TARGET_APPS[@]}"; do
    [[ "$app" == "api" || "$app" == "web-user" || "$app" == "web-admin" ]] && return 0
  done

  return 1
}

nginx_is_running() {
  docker ps --format '{{.Names}}' | grep -qx 'cinema-nginx-1'
}

sync_nginx() {
  if target_has_nginx; then
    log "Ensure nginx..."
    compose -f "$COMPOSE_OVERLAY" -f "$COMPOSE_OVERRIDE" up -d --no-build --remove-orphans nginx
    return
  fi

  target_has_public_app || return 0

  if nginx_is_running; then
    log "Reload nginx..."
    docker exec cinema-nginx-1 nginx -s reload || log "Warning: nginx reload failed"
  else
    log "Start nginx..."
    compose -f "$COMPOSE_OVERLAY" -f "$COMPOSE_OVERRIDE" up -d --no-build nginx
  fi
}

deploy_runtime() {
  local app
  local app_services=()

  log "Deploy ${TARGET_APPS[*]} ($DEPLOY_ENV)"

  prepare_images

  if [[ ${#IMAGE_SERVICES[@]} -gt 0 ]]; then
    compose -f "$COMPOSE_OVERLAY" -f "$COMPOSE_OVERRIDE" pull "${IMAGE_SERVICES[@]}"
  fi

  run_database_migrations

  for app in "${TARGET_APPS[@]}"; do
    [[ "$app" == "nginx" ]] || app_services+=("$app")
  done

  if [[ ${#app_services[@]} -gt 0 ]]; then
    compose -f "$COMPOSE_OVERLAY" -f "$COMPOSE_OVERRIDE" up -d --no-build --no-deps --remove-orphans "${app_services[@]}"
  fi

  sync_nginx
}

run_deploy() {
  [[ ${#REQUESTED_APPS[@]} -gt 0 ]] || die "At least one app is required"

  mkdir -p "$APP_DIR"
  cd "$APP_DIR"

  [[ -f "infrastructure/docker/compose.yml" ]] || die "compose.yml not found"

  : "${GHCR_USER:?GHCR_USER is required}"
  : "${GHCR_TOKEN:?GHCR_TOKEN is required}"

  echo "$GHCR_TOKEN" | docker login "$REGISTRY" -u "$GHCR_USER" --password-stdin

  normalize_target_apps
  resolve_image_services
  deploy_runtime
}
