#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"
configure_push_runtime_env
warn_if_android_push_native_config_missing

require_release_signing() {
  local required_variables=(
    TRANSPORT_UPLOAD_STORE_FILE
    TRANSPORT_UPLOAD_STORE_PASSWORD
    TRANSPORT_UPLOAD_KEY_ALIAS
    TRANSPORT_UPLOAD_KEY_PASSWORD
  )
  local missing_variables=()
  local variable_name

  for variable_name in "${required_variables[@]}"; do
    if [[ -z "${!variable_name:-}" ]]; then
      missing_variables+=("$variable_name")
    fi
  done

  if (( ${#missing_variables[@]} > 0 )); then
    echo "Android distribution releases require upload-key signing configuration." >&2
    printf 'Missing: %s\n' "${missing_variables[*]}" >&2
    exit 1
  fi
  [[ -f "$TRANSPORT_UPLOAD_STORE_FILE" ]] || {
    echo "Android upload keystore was not found: $TRANSPORT_UPLOAD_STORE_FILE" >&2
    exit 1
  }
}

require_release_signing

ENV_NAME="aws"
PROFILE="prod"
ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev)
      PROFILE="dev"
      apply_runtime_profile "$PROFILE"
      ENV_NAME="$TRANSPORT_PROFILE_ENV_NAME"
      ;;
    --prod)
      PROFILE="prod"
      apply_runtime_profile "$PROFILE"
      ENV_NAME="$TRANSPORT_PROFILE_ENV_NAME"
      ;;
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

RELEASE_ARGS=(--device --release --env "$ENV_NAME")
if (( ${#ARGS[@]} > 0 )); then
  RELEASE_ARGS=("${ARGS[@]}" "${RELEASE_ARGS[@]}")
fi

exec "$SCRIPT_DIR/install-android.sh" "${RELEASE_ARGS[@]}"
