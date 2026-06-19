#!/usr/bin/env bash
set -euo pipefail

ci_load_test_env() {
  if [[ -f .env.test ]]; then
    echo "Load test env..."
    set -a
    # shellcheck disable=SC1091
    source .env.test
    set +a
  fi
}

ci_prepare_workspace() {
  echo "Install deps..."
  pnpm install --frozen-lockfile

  echo "Generate OpenAPI schema..."
  pnpm openapi:generate:schema

  echo "Check OpenAPI schema is up to date..."
  if [[ -n "$(git status --porcelain -- apps/api/generated/openapi/schema.json)" ]]; then
    git status --short -- apps/api/generated/openapi/schema.json
    git diff -- apps/api/generated/openapi/schema.json
    echo "OpenAPI schema is stale. Run pnpm openapi:generate:schema and commit apps/api/generated/openapi/schema.json." >&2
    exit 1
  fi

  echo "Generate API client..."
  pnpm openapi:generate:types
}
