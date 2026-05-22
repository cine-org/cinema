#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.github/scripts/ci-prepare.sh
source "$SCRIPT_DIR/ci-prepare.sh"

ci_load_test_env
ci_prepare_workspace

if [[ -d packages/database ]]; then
  echo "Apply test database migrations..."
  pnpm db:test:deploy
else
  echo "Skip test database migrations; packages/database is not present yet."
fi

echo "Integration test..."
pnpm test:int

echo "E2E test..."
pnpm test:e2e
