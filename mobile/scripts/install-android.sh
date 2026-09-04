#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

TARGET="emulator"
BUILD_TYPE="debug"
SERIAL="${ANDROID_SERIAL:-}"
API_URL=""
ENV_NAME="local"
PROFILE=""
MIN_AVAILABLE_STORAGE_KIB=524288

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
    --emulator) TARGET="emulator" ;;
    --device) TARGET="device" ;;
    --release) BUILD_TYPE="release" ;;
    --debug) BUILD_TYPE="debug" ;;
    --env)
      shift
      ENV_NAME="${1:-}"
      validate_env_name "$ENV_NAME"
      ;;
    --api-url)
      shift
      API_URL="${1:-}"
      [[ -n "$API_URL" ]] || { echo "--api-url requires a URL." >&2; exit 2; }
      ;;
    --serial)
      shift
      SERIAL="${1:-}"
      [[ -n "$SERIAL" ]] || { echo "--serial requires a device serial." >&2; exit 2; }
      ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

resolve_mobile_node
require_command npm
resolve_android_sdk
resolve_android_java
configure_push_runtime_env
warn_if_android_push_native_config_missing
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
require_command adb
ensure_node_modules

# Optional local test login prefill. Keep empty unless explicitly set for local-only use.
export EXPO_PUBLIC_TEST_DRIVER_EMAIL="${EXPO_PUBLIC_TEST_DRIVER_EMAIL:-}"
export EXPO_PUBLIC_TEST_DRIVER_PASSWORD="${EXPO_PUBLIC_TEST_DRIVER_PASSWORD:-}"

if [[ -z "$API_URL" ]]; then
  API_TARGET="android-emulator"
  [[ "$TARGET" == "device" ]] && API_TARGET="android-device"
  API_URL="$(resolve_api_base_url "$ENV_NAME" "$API_TARGET")"
fi
export EXPO_PUBLIC_API_BASE_URL="$API_URL"
export NODE_ENV="${TRANSPORT_NODE_ENV:-$([[ "$BUILD_TYPE" == "debug" ]] && echo development || echo production)}"

ensure_device_storage() {
  local device_serial="$1"
  local available_kib
  available_kib="$(adb -s "$device_serial" shell df -k /data 2>/dev/null | awk 'END { print $4 }' | tr -d '\r')"

  if [[ ! "$available_kib" =~ ^[0-9]+$ ]]; then
    echo "Could not determine available /data storage on $device_serial." >&2
    exit 1
  fi
  if (( available_kib < MIN_AVAILABLE_STORAGE_KIB )); then
    echo "$device_serial has insufficient /data storage for installation (${available_kib} KiB available; 512 MiB required)." >&2
    echo "Free space on the device or wipe/recreate the emulator, then retry." >&2
    exit 1
  fi
}

adb start-server >/dev/null
SERIALS=()
if [[ -n "$SERIAL" ]]; then
  SERIALS=("$SERIAL")
else
  if [[ "$TARGET" == "emulator" ]]; then
    while IFS= read -r detected_serial; do
      [[ -n "$detected_serial" ]] && SERIALS+=("$detected_serial")
    done < <(adb devices | awk 'NR > 1 && $1 ~ /^emulator-/ && $2 == "device" { print $1 }')
  else
    while IFS= read -r detected_serial; do
      [[ -n "$detected_serial" ]] && SERIALS+=("$detected_serial")
    done < <(adb devices | awk 'NR > 1 && $1 !~ /^emulator-/ && $2 == "device" { print $1 }')
  fi
fi

if [[ ${#SERIALS[@]} -eq 0 ]]; then
  if [[ "$TARGET" == "emulator" ]]; then
    echo "No running Android emulator found. Start one from Android Studio Device Manager." >&2
  else
    echo "No authorized Android device found. Enable USB debugging and accept the authorization prompt." >&2
  fi
  exit 1
fi

for serial in "${SERIALS[@]}"; do
  ensure_device_storage "$serial"
done

echo "Building $BUILD_TYPE for ${#SERIALS[@]} $TARGET device(s)"
echo "API: $EXPO_PUBLIC_API_BASE_URL"
echo "Expo project: ${EXPO_PUBLIC_EAS_PROJECT_ID}"

cd "$PROJECT_ROOT/android"
for serial in "${SERIALS[@]}"; do
  DEVICE_ABI="$(adb -s "$serial" shell getprop ro.product.cpu.abi | tr -d '\r')"
  case "$DEVICE_ABI" in
    arm64-v8a|armeabi-v7a|x86|x86_64) ;;
    *) echo "Unsupported or unknown Android ABI on $serial: ${DEVICE_ABI:-empty}" >&2; exit 1 ;;
  esac

  echo "Installing on $serial (ABI: $DEVICE_ABI)"
  if [[ "$BUILD_TYPE" == "release" ]]; then
    GRADLE_RELEASE_ARGS=(assembleRelease --no-daemon -PreactNativeArchitectures="$DEVICE_ABI")
    if [[ "$EXPO_PUBLIC_API_BASE_URL" == https://* ]]; then
      GRADLE_RELEASE_ARGS+=(-PtransportUsesCleartextTraffic=false)
    fi
    NODE_ENV=production ./gradlew "${GRADLE_RELEASE_ARGS[@]}"
    APK_PATH="$PROJECT_ROOT/android/app/build/outputs/apk/release/app-release.apk"
  else
    NODE_ENV=development ./gradlew assembleDebug --no-daemon -PreactNativeArchitectures="$DEVICE_ABI"
    APK_PATH="$PROJECT_ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
  fi

  if [[ ! -f "$APK_PATH" ]]; then
    echo "APK not found at $APK_PATH" >&2
    exit 1
  fi

  adb -s "$serial" install -r -d "$APK_PATH"
  adb -s "$serial" shell am force-stop com.transportplatform.mobile >/dev/null 2>&1 || true
  adb -s "$serial" shell monkey -p com.transportplatform.mobile -c android.intent.category.LAUNCHER 1 >/dev/null
  echo "Installed and launched Transport Platform on $serial."
done
