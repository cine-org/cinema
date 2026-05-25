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

  echo "Build tooling..."
  pnpm --filter @repo/eslint-config build
  pnpm --filter @repo/jest-config build
  pnpm --filter @repo/vitest-config build

  echo "Build shared runtime packages..."
  pnpm --filter @repo/contracts build
  pnpm --filter @repo/shared build
  pnpm --filter @repo/database build

  echo "Generate API client..."
  pnpm --filter @repo/api-client generate
}
