#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
AWS_API_BASE_URL="${AWS_API_BASE_URL:-https://transport.bakaroo.com/api}"

case "$AWS_API_BASE_URL" in
  https://*) ;;
  *)
    echo "Android production releases require an HTTPS API URL: $AWS_API_BASE_URL" >&2
    exit 1
    ;;
esac

command -v curl >/dev/null || {
  echo "Missing required command: curl" >&2
  exit 1
}

echo "Checking AWS backend: $AWS_API_BASE_URL"
curl -fsS --max-time 20 "${AWS_API_BASE_URL%/}/actuator/health" >/dev/null || {
  echo "AWS backend health check failed: ${AWS_API_BASE_URL%/}/actuator/health" >&2
  exit 1
}

exec "$SCRIPT_DIR/install-android.sh" "$@" \
  --device \
  --release \
  --api-url "$AWS_API_BASE_URL"
