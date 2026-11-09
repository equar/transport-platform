#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

TARGET="device"
BUILD_TYPE="release"
ENV_NAME="aws"
PROFILE="prod"
apply_runtime_profile "$PROFILE"
INSTALL_AFTER_BUILD=false
API_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev)
      PROFILE="dev"
      apply_runtime_profile "$PROFILE"
      ENV_NAME="$TRANSPORT_PROFILE_ENV_NAME"
      BUILD_TYPE="debug"
      ;;
    --prod)
      PROFILE="prod"
      apply_runtime_profile "$PROFILE"
      ENV_NAME="$TRANSPORT_PROFILE_ENV_NAME"
      BUILD_TYPE="release"
      ;;
    --env)
      shift
      ENV_NAME="${1:-}"
      validate_env_name "$ENV_NAME"
      PROFILE="$([[ "$ENV_NAME" == "aws" ]] && echo prod || echo dev)"
      apply_runtime_profile "$PROFILE"
      ;;
    --api-url)
      shift
      API_URL="${1:-}"
      [[ -n "$API_URL" ]] || { echo "--api-url requires a URL." >&2; exit 2; }
      ;;
    --emulator) TARGET="emulator" ;;
    --device) TARGET="device" ;;
    --install) INSTALL_AFTER_BUILD=true ;;
    --debug) BUILD_TYPE="debug" ;;
    --release) BUILD_TYPE="release" ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

if [[ -z "$PROFILE" ]]; then
  if [[ "$ENV_NAME" == "aws" ]]; then
    PROFILE="prod"
    BUILD_TYPE="release"
    apply_runtime_profile "$PROFILE"
    ENV_NAME="$TRANSPORT_PROFILE_ENV_NAME"
  else
    PROFILE="dev"
    BUILD_TYPE="debug"
    apply_runtime_profile "$PROFILE"
    ENV_NAME="$TRANSPORT_PROFILE_ENV_NAME"
  fi
fi

if [[ "$BUILD_TYPE" == "release" ]]; then
  PROFILE="prod"
  apply_runtime_profile "$PROFILE"
  ENV_NAME="${ENV_NAME:-$TRANSPORT_PROFILE_ENV_NAME}"
  if [[ "$ENV_NAME" == "local" ]]; then
    echo "Release APK builds must target the production backend only. Remove the local override." >&2
    exit 2
  fi
fi

resolve_mobile_node
require_command npm
resolve_android_sdk
resolve_android_java
configure_push_runtime_env
warn_if_android_push_native_config_missing
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
require_command adb || true
ensure_node_modules

if [[ -z "$API_URL" ]]; then
  API_TARGET="android-emulator"
  [[ "$TARGET" == "device" ]] && API_TARGET="android-device"
  API_URL="$(resolve_api_base_url "$ENV_NAME" "$API_TARGET")"
fi

if [[ "$ENV_NAME" == "local" ]]; then
  export AWS_API_BASE_URL="${AWS_API_BASE_URL:-$LOCAL_DEFAULT_API_BASE_URL_ANDROID_EMULATOR}"
else
  export AWS_API_BASE_URL="${AWS_API_BASE_URL:-$AWS_DEFAULT_API_BASE_URL}"
fi

export EXPO_PUBLIC_API_BASE_URL="$API_URL"
export NODE_ENV="${TRANSPORT_NODE_ENV:-$([[ "$BUILD_TYPE" == "debug" ]] && echo development || echo production)}"

cd "$PROJECT_ROOT/android"
case "$BUILD_TYPE" in
  debug)
    GRADLE_TASK="assembleDebug"
    ;;
  release)
    GRADLE_TASK="assembleRelease"
    ;;
  *)
    echo "Unsupported Android build type: $BUILD_TYPE" >&2
    exit 2
    ;;
esac
./gradlew "$GRADLE_TASK" --no-daemon -PreactNativeArchitectures="arm64-v8a"
APK_PATH="$PROJECT_ROOT/android/app/build/outputs/apk/${BUILD_TYPE}/app-${BUILD_TYPE}.apk"

if [[ ! -f "$APK_PATH" ]]; then
  echo "APK not found at $APK_PATH" >&2
  exit 1
fi

echo "APK ready: $APK_PATH"

if [[ "$INSTALL_AFTER_BUILD" == true ]]; then
  if [[ "$TARGET" == "emulator" ]]; then
    adb devices | awk 'NR>1 && $2=="device" && $1 ~ /^emulator-/ { print $1 }' | head -n 1 | while IFS= read -r serial; do
      adb -s "$serial" install -r -d "$APK_PATH"
    done
  else
    adb devices | awk 'NR>1 && $2=="device" && $1 !~ /^emulator-/ { print $1 }' | head -n 1 | while IFS= read -r serial; do
      adb -s "$serial" install -r -d "$APK_PATH"
    done
  fi
fi
