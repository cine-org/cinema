#!/usr/bin/env bash
set -euo pipefail

BUMP="${1:?bump is required}"

[[ "$BUMP" =~ ^(major|minor|patch)$ ]] || {
  echo "Invalid bump: $BUMP" >&2
  exit 1
}

LATEST_TAG="$(git tag --list 'v[0-9]*.[0-9]*.[0-9]*' --sort=-v:refname | head -n 1 || true)"

if [[ -z "$LATEST_TAG" ]]; then
  major=0
  minor=0
  patch=0
else
  version="${LATEST_TAG#v}"
  IFS='.' read -r major minor patch <<< "$version"
fi

case "$BUMP" in
  major)
    major=$((major + 1))
    minor=0
    patch=0
    ;;
  minor)
    minor=$((minor + 1))
    patch=0
    ;;
  patch)
    patch=$((patch + 1))
    ;;
esac

echo "v${major}.${minor}.${patch}"
