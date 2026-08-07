#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

require_command node
require_command npm
require_command xcodebuild
require_command xcrun
ensure_node_modules
require_physical_api_url "ios:device"
export NODE_ENV=production

DEVELOPMENT_TEAM="${DEVELOPMENT_TEAM:-}"
DEVICE_UDID="${IOS_DEVICE_UDID:-}"
WORKSPACE="${WORKSPACE:-TransportPlatform.xcworkspace}"
SCHEME="${SCHEME:-TransportPlatform}"
APP_ID="${APP_ID:-com.transportplatform.mobile}"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-$PROJECT_ROOT/.build/ios-device}"

if [[ -z "$DEVELOPMENT_TEAM" ]]; then
  echo "DEVELOPMENT_TEAM is required for physical iOS signing." >&2
  echo "Find the 10-character Team ID in Apple Developer membership or Xcode account settings." >&2
  exit 1
fi

if [[ -z "$DEVICE_UDID" ]]; then
  DEVICE_UDID="$(xcrun xctrace list devices 2>/dev/null | sed -n 's/.*(\([A-F0-9-]\{8\}-[A-F0-9-]*\))$/\1/p' | head -n 1)"
fi
if [[ -z "$DEVICE_UDID" ]]; then
  echo "No connected iOS device found. Unlock it, trust this Mac, and enable Developer Mode." >&2
  exit 1
fi

if [[ ! -d "$PROJECT_ROOT/ios/Pods" ]]; then
  "$SCRIPT_DIR/setup-ios.sh"
fi

echo "Building signed iOS app for $DEVICE_UDID"
echo "API: $EXPO_PUBLIC_API_BASE_URL"
(cd "$PROJECT_ROOT/ios" && xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination "id=$DEVICE_UDID" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$DEVELOPMENT_TEAM" \
  CODE_SIGN_STYLE=Automatic \
  build)

APP_PATH="$DERIVED_DATA_PATH/Build/Products/Release-iphoneos/TransportPlatform.app"
if [[ ! -d "$APP_PATH" ]]; then
  echo "Built app not found: $APP_PATH" >&2
  exit 1
fi

xcrun devicectl device install app --device "$DEVICE_UDID" "$APP_PATH"
xcrun devicectl device process launch --device "$DEVICE_UDID" --terminate-existing "$APP_ID" || true
echo "Installed Transport Platform on iOS device $DEVICE_UDID."
