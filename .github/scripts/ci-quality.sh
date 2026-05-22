#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.github/scripts/ci-prepare.sh
source "$SCRIPT_DIR/ci-prepare.sh"

ci_load_test_env
ci_prepare_workspace

echo "Lint..."
pnpm lint

echo "Typecheck..."
pnpm typecheck

echo "Build..."
pnpm build

echo "Unit test..."
pnpm test
