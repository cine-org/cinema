#!/usr/bin/env bash
set -euo pipefail

readonly MODE="${1:-}"
readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly SQL_DIR="${SCRIPT_DIR}/sql"
readonly ROLLOUT_DIR="${SCRIPT_DIR}/rollouts"

required_variables=(
  PGHOST
  PGPORT
  PGDATABASE
  PGUSER
  PGPASSWORD
  DB_APP_USER
  DB_APP_PASSWORD
  DB_MIGRATOR_USER
  DB_MIGRATOR_PASSWORD
)

for variable in "${required_variables[@]}"; do
  [[ -n "${!variable:-}" ]] || {
    echo "Error: ${variable} is required" >&2
    exit 1
  }
done

[[ "$DB_APP_USER" != "$DB_MIGRATOR_USER" ]] || {
  echo 'Error: DB_APP_USER and DB_MIGRATOR_USER must be different' >&2
  exit 1
}

[[ "$DB_APP_USER" != "$PGUSER" && "$DB_MIGRATOR_USER" != "$PGUSER" ]] || {
  echo 'Error: application roles must differ from the bootstrap role' >&2
  exit 1
}

run_sql() {
  local file="$1"

  psql \
    --no-psqlrc \
    --set=ON_ERROR_STOP=1 \
    --set=database_name="$PGDATABASE" \
    --set=app_user="$DB_APP_USER" \
    --set=app_password="$DB_APP_PASSWORD" \
    --set=migrator_user="$DB_MIGRATOR_USER" \
    --set=migrator_password="$DB_MIGRATOR_PASSWORD" \
    --file="$file"
}

prepare() {
  run_sql "${SQL_DIR}/001-roles.sql"
  run_sql "${SQL_DIR}/002-base-privileges.sql"
}

reconcile() {
  run_sql "${SQL_DIR}/003-runtime-privileges.sql"
  run_sql "${SQL_DIR}/004-verify.sql"
}

case "$MODE" in
  prepare)
    prepare
    ;;
  reconcile)
    reconcile
    ;;
  verify)
    run_sql "${SQL_DIR}/004-verify.sql"
    ;;
  rollout-adopt-existing)
    prepare
    run_sql "${ROLLOUT_DIR}/001-adopt-existing-objects.sql"
    reconcile
    ;;
  *)
    echo 'Usage: provision.sh <prepare|reconcile|verify|rollout-adopt-existing>' >&2
    exit 1
    ;;
esac
