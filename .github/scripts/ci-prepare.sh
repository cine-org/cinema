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

ci_build_package_if_present() {
  local package_name="$1"
  local package_dir="$2"

  if [[ -d "$package_dir" ]]; then
    echo "Build ${package_name}..."
    pnpm --filter "$package_name" build
  fi
}

ci_prepare_workspace() {
  echo "Install deps..."
  pnpm install --frozen-lockfile

  echo "Build tooling..."
  pnpm --filter @repo/eslint-config build
  pnpm --filter @repo/jest-config build
  pnpm --filter @repo/vitest-config build

  ci_build_package_if_present "@repo/contracts" "packages/contracts"
  ci_build_package_if_present "@repo/shared" "modules/shared"
  ci_build_package_if_present "@repo/database" "packages/database"

  if [[ -d packages/api-client ]]; then
    echo "Generate API client..."
    pnpm --filter @repo/api-client generate
  fi
}
