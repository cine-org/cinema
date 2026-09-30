#!/usr/bin/env bash
# Waits for the latest staging run on main and exits with its result; passes if staging never ran.
set -euo pipefail
shopt -s inherit_errexit

run_id="$(gh run list --workflow staging.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId // empty')"

if [[ -z "$run_id" ]]; then
  echo "No staging run yet."
  exit 0
fi

gh run watch "$run_id" --interval 30 --exit-status
