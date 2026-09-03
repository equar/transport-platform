#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

load_mobile_env() {
  if [[ -f "$PROJECT_ROOT/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$PROJECT_ROOT/.env"
    set +a
  fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    return 1
  fi
}

ensure_node_modules() {
  # Keep script execution pinned to this workspace to avoid parent/global node_modules drift.
  unset NODE_PATH
  export PATH="$PROJECT_ROOT/node_modules/.bin:$PATH"

  if [[ -d "$PROJECT_ROOT/node_modules" ]]; then
    return
  fi
  echo "Installing JavaScript dependencies..."
  (cd "$PROJECT_ROOT" && npm ci --legacy-peer-deps --no-audit --no-fund)
}

resolve_android_sdk() {
  if [[ -n "${ANDROID_HOME:-}" && -d "$ANDROID_HOME" ]]; then
    export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
    return
  fi
  if [[ -n "${ANDROID_SDK_ROOT:-}" && -d "$ANDROID_SDK_ROOT" ]]; then
    export ANDROID_HOME="$ANDROID_SDK_ROOT"
    return
  fi
  local default_sdk="$HOME/Library/Android/sdk"
  if [[ -d "$default_sdk" ]]; then
    export ANDROID_HOME="$default_sdk"
    export ANDROID_SDK_ROOT="$default_sdk"
    return
  fi
  echo "Android SDK not found. Set ANDROID_HOME or install Android Studio." >&2
  return 1
}

resolve_android_java() {
  local candidate=""
  if [[ -x "/usr/libexec/java_home" ]]; then
    candidate="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
    if [[ -z "$candidate" ]]; then
      candidate="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"
    fi
  fi
  if [[ -n "$candidate" ]]; then
    export JAVA_HOME="$candidate"
    export PATH="$JAVA_HOME/bin:$PATH"
  fi
  require_command java
}

AWS_DEFAULT_API_BASE_URL="https://transport.bakaroo.com/api"
LOCAL_DEFAULT_API_BASE_URL_ANDROID_EMULATOR="http://10.0.2.2:8087/api"
LOCAL_DEFAULT_API_BASE_URL_IOS_SIMULATOR="http://127.0.0.1:8087/api"
TRANSPORT_DEFAULT_EAS_PROJECT_ID="80182d4a-8191-4f8c-9d44-7937ad4d94c2"

validate_env_name() {
  case "$1" in
    aws|local) ;;
    *) echo "--env must be 'aws' or 'local' (got '${1:-}')" >&2; return 1 ;;
  esac
}

validate_profile_name() {
  case "$1" in
    dev|prod) ;;
    *) echo "Profile must be 'dev' or 'prod' (got '${1:-}')" >&2; return 1 ;;
  esac
}

# Applies a runtime profile to env selection and common process settings.
# dev  -> local backend and development runtime
# prod -> aws backend and production runtime
apply_runtime_profile() {
  local profile_name="$1"
  validate_profile_name "$profile_name"

  case "$profile_name" in
    dev)
      export TRANSPORT_RUNTIME_PROFILE=dev
      export TRANSPORT_NODE_ENV=development
      export TRANSPORT_PROFILE_ENV_NAME=local
      ;;
    prod)
      export TRANSPORT_RUNTIME_PROFILE=prod
      export TRANSPORT_NODE_ENV=production
      export TRANSPORT_PROFILE_ENV_NAME=aws
      ;;
  esac
}

# Resolves the backend API base URL for a given environment and install target.
#   env_name: aws | local
#   target:   android-emulator | android-device | ios-simulator | ios-device
resolve_api_base_url() {
  local env_name="$1"
  local target="$2"

  case "$env_name" in
    aws)
      local url="${AWS_API_BASE_URL:-$AWS_DEFAULT_API_BASE_URL}"
      case "$url" in
        https://*) ;;
        *) echo "AWS_API_BASE_URL must use HTTPS: $url" >&2; return 1 ;;
      esac
      echo "$url"
      ;;
    local)
      case "$target" in
        android-emulator)
          echo "${LOCAL_API_BASE_URL:-$LOCAL_DEFAULT_API_BASE_URL_ANDROID_EMULATOR}"
          ;;
        ios-simulator)
          echo "${LOCAL_API_BASE_URL:-$LOCAL_DEFAULT_API_BASE_URL_IOS_SIMULATOR}"
          ;;
        android-device|ios-device)
          if [[ -z "${LOCAL_API_BASE_URL:-}" ]]; then
            echo "LOCAL_API_BASE_URL is required to reach a local backend from a physical device." >&2
            echo "Example: LOCAL_API_BASE_URL=http://192.168.1.50:8087/api npm run <script> -- --env local" >&2
            return 1
          fi
          case "$LOCAL_API_BASE_URL" in
            *localhost*|*127.0.0.1*|*10.0.2.2*)
              echo "Physical devices cannot reach API URL: $LOCAL_API_BASE_URL" >&2
              echo "Use your computer's LAN IP address instead of localhost." >&2
              return 1
              ;;
          esac
          echo "$LOCAL_API_BASE_URL"
          ;;
        *)
          echo "Unknown install target: $target" >&2
          return 1
          ;;
      esac
      ;;
    *)
      echo "Unknown environment '$env_name' (expected 'aws' or 'local')" >&2
      return 1
      ;;
  esac
}

configure_push_runtime_env() {
  export EXPO_PUBLIC_EAS_PROJECT_ID="${EXPO_PUBLIC_EAS_PROJECT_ID:-$TRANSPORT_DEFAULT_EAS_PROJECT_ID}"
  export EXPO_PUBLIC_EXPO_PROJECT_ID="${EXPO_PUBLIC_EXPO_PROJECT_ID:-$EXPO_PUBLIC_EAS_PROJECT_ID}"

  if [[ -z "${EXPO_ANDROID_GOOGLE_SERVICES_FILE:-}" && -z "${GOOGLE_SERVICES_JSON:-}" ]]; then
    local candidate
    for candidate in \
      "$PROJECT_ROOT/google-services.json" \
      "$PROJECT_ROOT/android/app/google-services.json"
    do
      if [[ -f "$candidate" ]]; then
        export EXPO_ANDROID_GOOGLE_SERVICES_FILE="$candidate"
        break
      fi
    done
  fi

  configure_environment_resources
}

# Select optional environment-specific native resource files when available.
# Falls back to existing defaults when profile-specific files do not exist.
configure_environment_resources() {
  local profile="${TRANSPORT_RUNTIME_PROFILE:-}"
  [[ -n "$profile" ]] || return 0

  local android_candidate="$PROJECT_ROOT/google-services.$profile.json"
  if [[ -f "$android_candidate" ]]; then
    export EXPO_ANDROID_GOOGLE_SERVICES_FILE="$android_candidate"
  fi

  local ios_candidate="$PROJECT_ROOT/GoogleService-Info.$profile.plist"
  if [[ -f "$ios_candidate" ]]; then
    export EXPO_IOS_GOOGLE_SERVICES_FILE="$ios_candidate"
  fi

  export EXPO_PUBLIC_APP_ENV="$profile"
}

warn_if_android_push_native_config_missing() {
  if [[ -n "${EXPO_ANDROID_GOOGLE_SERVICES_FILE:-}" || -n "${GOOGLE_SERVICES_JSON:-}" ]]; then
    return
  fi

  echo "Warning: Android Firebase config not found (google-services.json)." >&2
  echo "Android push token registration may be unavailable until that file is added." >&2
}

load_mobile_env
