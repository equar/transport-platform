#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

ENV_NAME="aws"
ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      shift
      ENV_NAME="${1:-}"
      validate_env_name "$ENV_NAME"
      ;;
    *) ARGS+=("$1") ;;
  esac
  shift
done

if [[ "$ENV_NAME" == "aws" ]]; then
  AWS_API_BASE_URL="${AWS_API_BASE_URL:-$AWS_DEFAULT_API_BASE_URL}"

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

  export AWS_API_BASE_URL
fi

exec "$SCRIPT_DIR/install-android.sh" "${ARGS[@]}" \
  --device \
  --release \
  --env "$ENV_NAME"
