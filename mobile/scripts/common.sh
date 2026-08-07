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

api_url_for_android_emulator() {
  echo "${EXPO_PUBLIC_API_BASE_URL:-http://10.0.2.2:8087/api}"
}

require_physical_api_url() {
  if [[ -z "${EXPO_PUBLIC_API_BASE_URL:-}" ]]; then
    echo "EXPO_PUBLIC_API_BASE_URL is required for a physical device." >&2
    echo "Example: EXPO_PUBLIC_API_BASE_URL=http://192.168.1.50:8087/api npm run $1" >&2
    return 1
  fi
  case "$EXPO_PUBLIC_API_BASE_URL" in
    *localhost*|*127.0.0.1*|*10.0.2.2*)
      echo "Physical devices cannot reach API URL: $EXPO_PUBLIC_API_BASE_URL" >&2
      echo "Use your computer's LAN IP address or an HTTPS development endpoint." >&2
      return 1
      ;;
  esac
}

load_mobile_env
