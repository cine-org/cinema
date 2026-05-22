#!/bin/sh
set -eu

CONFIG_FILE=/usr/share/nginx/html/config.js

if [ -n "${API_ORIGIN:-}" ] || [ -n "${API_PREFIX:-}" ]; then
  escaped_api_origin=$(printf '%s' "${API_ORIGIN:-}" | sed 's/\\/\\\\/g; s/"/\\"/g')
  escaped_api_prefix=$(printf '%s' "${API_PREFIX:-}" | sed 's/\\/\\\\/g; s/"/\\"/g')

  cat > "$CONFIG_FILE" <<EOF
window.__APP_CONFIG__ = {
  apiOrigin: "$escaped_api_origin",
  apiPrefix: "$escaped_api_prefix"
};
EOF
else
  cat > "$CONFIG_FILE" <<'EOF'
window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};
EOF
fi
