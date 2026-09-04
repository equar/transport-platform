#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

resolve_mobile_node

ENV_NAME="local"
API_URL=""
PROFILE=""

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
configure_push_runtime_env
ensure_node_modules

if [[ -z "$API_URL" ]]; then
  API_URL="$(resolve_api_base_url "$ENV_NAME" "ios-device")"
fi
export EXPO_PUBLIC_API_BASE_URL="$API_URL"
export EXPO_PUBLIC_TEST_DRIVER_EMAIL="${EXPO_PUBLIC_TEST_DRIVER_EMAIL:-}"
export EXPO_PUBLIC_TEST_DRIVER_PASSWORD="${EXPO_PUBLIC_TEST_DRIVER_PASSWORD:-}"
export NODE_ENV="${TRANSPORT_NODE_ENV:-production}"

BUILD_CONFIGURATION="Release"
if [[ "${TRANSPORT_RUNTIME_PROFILE:-}" == "dev" ]]; then
  BUILD_CONFIGURATION="Debug"
fi

DEVELOPMENT_TEAM="${DEVELOPMENT_TEAM:-}"
DEVICE_UDID="${IOS_DEVICE_UDID:-}"
WORKSPACE="${WORKSPACE:-TransportPlatform.xcworkspace}"
SCHEME="${SCHEME:-TransportPlatform}"
APP_ID="${APP_ID:-com.transportplatform.mobile}"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-$PROJECT_ROOT/.build/ios-device}"
TARGET_DEVICE_UDIDS=()

if [[ -z "$DEVELOPMENT_TEAM" ]]; then
  echo "DEVELOPMENT_TEAM is required for physical iOS signing." >&2
  echo "Find the 10-character Team ID in Apple Developer membership or Xcode account settings." >&2
  exit 1
fi

if [[ -n "$DEVICE_UDID" ]]; then
  TARGET_DEVICE_UDIDS=("$DEVICE_UDID")
else
  while IFS= read -r udid; do
    [[ -n "$udid" ]] && TARGET_DEVICE_UDIDS+=("$udid")
  done < <(
    xcrun devicectl list devices 2>/dev/null \
      | sed -n 's/.*identifier: \([A-Za-z0-9.-]\+\).*(transport: local).*/\1/p'
  )
fi

if [[ ${#TARGET_DEVICE_UDIDS[@]} -eq 0 ]]; then
  echo "No connected iOS device found. Unlock it, trust this Mac, and enable Developer Mode." >&2
  exit 1
fi

if [[ ! -d "$PROJECT_ROOT/ios/Pods" ]]; then
  "$SCRIPT_DIR/setup-ios.sh"
fi

echo "Building signed iOS app for ${#TARGET_DEVICE_UDIDS[@]} connected device(s)"
echo "API: $EXPO_PUBLIC_API_BASE_URL"
echo "Expo project: $EXPO_PUBLIC_EAS_PROJECT_ID"
(cd "$PROJECT_ROOT/ios" && xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration "$BUILD_CONFIGURATION" \
  -destination "id=${TARGET_DEVICE_UDIDS[0]}" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$DEVELOPMENT_TEAM" \
  CODE_SIGN_STYLE=Automatic \
  build)

APP_PATH="$DERIVED_DATA_PATH/Build/Products/${BUILD_CONFIGURATION}-iphoneos/TransportPlatform.app"
if [[ ! -d "$APP_PATH" ]]; then
  echo "Built app not found: $APP_PATH" >&2
  exit 1
fi

for device_udid in "${TARGET_DEVICE_UDIDS[@]}"; do
  echo "Installing on iOS device $device_udid..."
  xcrun devicectl device install app --device "$device_udid" "$APP_PATH"
  xcrun devicectl device process launch --device "$device_udid" --terminate-existing "$APP_ID" || true
  echo "Installed Transport Platform on iOS device $device_udid."
done
