#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

TARGET="emulator"
BUILD_TYPE="release"
SERIAL="${ANDROID_SERIAL:-}"
API_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --emulator) TARGET="emulator" ;;
    --device) TARGET="device" ;;
    --release) BUILD_TYPE="release" ;;
    --debug) BUILD_TYPE="debug" ;;
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

if [[ -n "$API_URL" ]]; then
  export EXPO_PUBLIC_API_BASE_URL="$API_URL"
fi

require_command node
require_command npm
resolve_android_sdk
resolve_android_java
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
require_command adb
ensure_node_modules

# Local test builds intentionally prefill the primary driver account so repeated
# simulator and physical-device login testing does not require manual entry.
export EXPO_PUBLIC_TEST_DRIVER_EMAIL="${EXPO_PUBLIC_TEST_DRIVER_EMAIL:-samuelweld2018+d1@gmail.com}"
export EXPO_PUBLIC_TEST_DRIVER_PASSWORD="${EXPO_PUBLIC_TEST_DRIVER_PASSWORD:-DriverTest123!}"

if [[ "$TARGET" == "device" ]]; then
  require_physical_api_url "android:device"
else
  export EXPO_PUBLIC_API_BASE_URL="$(api_url_for_android_emulator)"
fi

adb start-server >/dev/null
if [[ -z "$SERIAL" ]]; then
  if [[ "$TARGET" == "emulator" ]]; then
    SERIAL="$(adb devices | awk 'NR > 1 && $1 ~ /^emulator-/ && $2 == "device" { print $1; exit }')"
  else
    SERIAL="$(adb devices | awk 'NR > 1 && $1 !~ /^emulator-/ && $2 == "device" { print $1; exit }')"
  fi
fi

if [[ -z "$SERIAL" ]]; then
  if [[ "$TARGET" == "emulator" ]]; then
    echo "No running Android emulator found. Start one from Android Studio Device Manager." >&2
  else
    echo "No authorized Android device found. Enable USB debugging and accept the authorization prompt." >&2
  fi
  exit 1
fi

echo "Building $BUILD_TYPE for $TARGET $SERIAL"
echo "API: $EXPO_PUBLIC_API_BASE_URL"

DEVICE_ABI="$(adb -s "$SERIAL" shell getprop ro.product.cpu.abi | tr -d '\r')"
case "$DEVICE_ABI" in
  arm64-v8a|armeabi-v7a|x86|x86_64) ;;
  *) echo "Unsupported or unknown Android ABI: ${DEVICE_ABI:-empty}" >&2; exit 1 ;;
esac
echo "Architecture: $DEVICE_ABI"

cd "$PROJECT_ROOT/android"
if [[ "$BUILD_TYPE" == "release" ]]; then
  GRADLE_RELEASE_ARGS=(assembleRelease --no-daemon -PreactNativeArchitectures="$DEVICE_ABI")
  if [[ "$EXPO_PUBLIC_API_BASE_URL" == https://* ]]; then
    GRADLE_RELEASE_ARGS+=(-PtransportUsesCleartextTraffic=false)
  fi
  NODE_ENV=production ./gradlew "${GRADLE_RELEASE_ARGS[@]}"
  APK_PATH="$PROJECT_ROOT/android/app/build/outputs/apk/release/app-universal-release.apk"
else
  NODE_ENV=development ./gradlew assembleDebug --no-daemon -PreactNativeArchitectures="$DEVICE_ABI"
  APK_PATH="$PROJECT_ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
fi

if [[ ! -f "$APK_PATH" ]]; then
  echo "APK not found at $APK_PATH" >&2
  exit 1
fi

adb -s "$SERIAL" install -r -d "$APK_PATH"
adb -s "$SERIAL" shell am force-stop com.transportplatform.mobile >/dev/null 2>&1 || true
adb -s "$SERIAL" shell monkey -p com.transportplatform.mobile -c android.intent.category.LAUNCHER 1 >/dev/null
echo "Installed and launched Transport Platform on $SERIAL."
