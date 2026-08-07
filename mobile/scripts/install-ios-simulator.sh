#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

ENV_NAME="local"
API_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
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
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

require_command node
require_command npm
require_command xcodebuild
require_command xcrun
ensure_node_modules

if [[ -n "$API_URL" ]]; then
  export EXPO_PUBLIC_API_BASE_URL="$API_URL"
elif [[ -z "${EXPO_PUBLIC_API_BASE_URL:-}" ]]; then
  export EXPO_PUBLIC_API_BASE_URL="$(resolve_api_base_url "$ENV_NAME" "ios-simulator")"
fi
export EXPO_PUBLIC_SIMULATOR_SESSION_STORAGE=true
export EXPO_PUBLIC_TEST_DRIVER_EMAIL="${EXPO_PUBLIC_TEST_DRIVER_EMAIL:-samuelweld2018+d1@gmail.com}"
export EXPO_PUBLIC_TEST_DRIVER_PASSWORD="${EXPO_PUBLIC_TEST_DRIVER_PASSWORD:-DriverTest123!}"
export NODE_ENV=production
WORKSPACE="${WORKSPACE:-TransportPlatform.xcworkspace}"
SCHEME="${SCHEME:-TransportPlatform}"
APP_ID="${APP_ID:-com.transportplatform.mobile}"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-$PROJECT_ROOT/.build/ios-simulator}"
SIMULATOR_UDID="${SIMULATOR_UDID:-}"
AVAILABLE_SIMULATORS="$(xcrun simctl list devices available)"
HOST_ARCH="$(uname -m)"
APPLE_SILICON_CAPABLE="$(sysctl -n hw.optional.arm64 2>/dev/null || echo 0)"
if [[ "$HOST_ARCH" == "arm64" || "$APPLE_SILICON_CAPABLE" == "1" ]]; then
  SIMULATOR_ARCH="arm64"
else
  SIMULATOR_ARCH="x86_64"
fi

if [[ -n "$SIMULATOR_UDID" && "$AVAILABLE_SIMULATORS" != *"($SIMULATOR_UDID)"* ]]; then
  echo "Configured simulator $SIMULATOR_UDID is no longer available; selecting another simulator."
  SIMULATOR_UDID=""
fi

if [[ -z "$SIMULATOR_UDID" ]]; then
  SIMULATOR_UDID="$(printf '%s\n' "$AVAILABLE_SIMULATORS" | sed -n '/iPhone/s/.*(\([A-F0-9-]\{36\}\)) (Booted)[[:space:]]*$/\1/p' | tail -n 1)"
fi

if [[ -z "$SIMULATOR_UDID" ]]; then
  SIMULATOR_UDID="$(printf '%s\n' "$AVAILABLE_SIMULATORS" | sed -n '/iPhone/s/.*(\([A-F0-9-]\{36\}\)) (Shutdown)[[:space:]]*$/\1/p' | tail -n 1)"
fi

if [[ -z "$SIMULATOR_UDID" ]]; then
  echo "No iOS Simulator runtime is installed. Install one in Xcode Settings > Components." >&2
  exit 1
fi

if [[ "$AVAILABLE_SIMULATORS" != *"($SIMULATOR_UDID) (Booted)"* ]]; then
  echo "Booting simulator $SIMULATOR_UDID..."
  xcrun simctl boot "$SIMULATOR_UDID" >/dev/null 2>&1 || true
fi

open -a Simulator >/dev/null 2>&1 || true
xcrun simctl bootstatus "$SIMULATOR_UDID" -b

if [[ ! -d "$PROJECT_ROOT/ios/Pods" ]]; then
  echo "CocoaPods are not installed. Running iOS setup..."
  "$SCRIPT_DIR/setup-ios.sh"
fi

echo "Building standalone iOS Simulator app"
echo "API: $EXPO_PUBLIC_API_BASE_URL"
pushd "$PROJECT_ROOT/ios" >/dev/null
xcodebuild \
  -quiet \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -sdk iphonesimulator \
  -destination "id=$SIMULATOR_UDID" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  CODE_SIGNING_ALLOWED=NO \
  ONLY_ACTIVE_ARCH=YES \
  ARCHS="$SIMULATOR_ARCH" \
  build
popd >/dev/null

APP_PATH="$DERIVED_DATA_PATH/Build/Products/Release-iphonesimulator/TransportPlatform.app"
if [[ ! -d "$APP_PATH" ]]; then
  echo "Built app not found: $APP_PATH" >&2
  exit 1
fi

RUNNING_SIMULATORS="$(xcrun simctl list devices available \
  | sed -n 's/.*(\([A-F0-9-]\{36\}\)) (Booted)[[:space:]]*$/\1/p')"

if [[ -z "$RUNNING_SIMULATORS" ]]; then
  echo "No booted iOS simulators were found after the build completed." >&2
  exit 1
fi

INSTALL_COUNT=0
INSTALL_FAILURES=0
while IFS= read -r DEVICE_UDID; do
  [[ -n "$DEVICE_UDID" ]] || continue
  INSTALL_COUNT=$((INSTALL_COUNT + 1))
  echo "Installing on booted iOS Simulator $DEVICE_UDID..."
  xcrun simctl uninstall "$DEVICE_UDID" "$APP_ID" >/dev/null 2>&1 || true
  if ! xcrun simctl install "$DEVICE_UDID" "$APP_PATH"; then
    echo "Failed to install on iOS Simulator $DEVICE_UDID." >&2
    INSTALL_FAILURES=$((INSTALL_FAILURES + 1))
    continue
  fi
  if ! xcrun simctl launch --terminate-running-process "$DEVICE_UDID" "$APP_ID"; then
    echo "Installed but failed to launch on iOS Simulator $DEVICE_UDID." >&2
    INSTALL_FAILURES=$((INSTALL_FAILURES + 1))
    continue
  fi
  echo "Installed and launched Transport Platform on iOS Simulator $DEVICE_UDID."
done <<< "$RUNNING_SIMULATORS"

if [[ "$INSTALL_FAILURES" -gt 0 ]]; then
  echo "Installation completed with $INSTALL_FAILURES failure(s) across $INSTALL_COUNT booted simulator(s)." >&2
  exit 1
fi

echo "Installed and launched Transport Platform on all $INSTALL_COUNT booted iOS simulator(s)."
