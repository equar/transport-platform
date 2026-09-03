#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

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

if [[ -n "$API_URL" ]]; then
  export EXPO_PUBLIC_API_BASE_URL="$API_URL"
elif [[ -z "${EXPO_PUBLIC_API_BASE_URL:-}" ]]; then
  export EXPO_PUBLIC_API_BASE_URL="$(resolve_api_base_url "$ENV_NAME" "ios-simulator")"
fi
export EXPO_PUBLIC_SIMULATOR_SESSION_STORAGE=true
export EXPO_PUBLIC_TEST_DRIVER_EMAIL="${EXPO_PUBLIC_TEST_DRIVER_EMAIL:-}"
export EXPO_PUBLIC_TEST_DRIVER_PASSWORD="${EXPO_PUBLIC_TEST_DRIVER_PASSWORD:-}"
export NODE_ENV="${TRANSPORT_NODE_ENV:-production}"

BUILD_CONFIGURATION="Release"
if [[ "${TRANSPORT_RUNTIME_PROFILE:-}" == "dev" ]]; then
  BUILD_CONFIGURATION="Debug"
fi
WORKSPACE="${WORKSPACE:-TransportPlatform.xcworkspace}"
SCHEME="${SCHEME:-TransportPlatform}"
APP_ID="${APP_ID:-com.transportplatform.mobile}"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-$PROJECT_ROOT/.build/ios-simulator}"
SIMULATOR_UDID="${SIMULATOR_UDID:-}"
AVAILABLE_SIMULATORS="$(xcrun simctl list devices available)"
BOOTED_SIMULATORS=()
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

while IFS= read -r booted_udid; do
  [[ -n "$booted_udid" ]] && BOOTED_SIMULATORS+=("$booted_udid")
done < <(printf '%s\n' "$AVAILABLE_SIMULATORS" | sed -n '/iPhone/s/.*(\([A-F0-9-]\{36\}\)) (Booted)[[:space:]]*$/\1/p')

if [[ -n "$SIMULATOR_UDID" ]]; then
  BOOTED_SIMULATORS=("$SIMULATOR_UDID")
fi

if [[ ${#BOOTED_SIMULATORS[@]} -eq 0 ]]; then
  SIMULATOR_UDID="$(printf '%s\n' "$AVAILABLE_SIMULATORS" | sed -n '/iPhone/s/.*(\([A-F0-9-]\{36\}\)) (Shutdown)[[:space:]]*$/\1/p' | tail -n 1)"
fi

if [[ ${#BOOTED_SIMULATORS[@]} -eq 0 && -z "$SIMULATOR_UDID" ]]; then
  echo "No iOS Simulator runtime is installed. Install one in Xcode Settings > Components." >&2
  exit 1
fi

if [[ ${#BOOTED_SIMULATORS[@]} -eq 0 && "$AVAILABLE_SIMULATORS" != *"($SIMULATOR_UDID) (Booted)"* ]]; then
  echo "Booting simulator $SIMULATOR_UDID..."
  xcrun simctl boot "$SIMULATOR_UDID" >/dev/null 2>&1 || true
fi

open -a Simulator >/dev/null 2>&1 || true

if [[ ${#BOOTED_SIMULATORS[@]} -eq 0 ]]; then
  xcrun simctl bootstatus "$SIMULATOR_UDID" -b
  BOOTED_SIMULATORS=("$SIMULATOR_UDID")
fi

if [[ ! -d "$PROJECT_ROOT/ios/Pods" ]]; then
  echo "CocoaPods are not installed. Running iOS setup..."
  "$SCRIPT_DIR/setup-ios.sh"
fi

echo "Building standalone iOS Simulator app"
echo "API: $EXPO_PUBLIC_API_BASE_URL"
echo "Expo project: $EXPO_PUBLIC_EAS_PROJECT_ID"
echo "Booted simulators: ${BOOTED_SIMULATORS[*]}"
pushd "$PROJECT_ROOT/ios" >/dev/null
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration "$BUILD_CONFIGURATION" \
  -sdk iphonesimulator \
  -destination "id=${BOOTED_SIMULATORS[0]}" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  CODE_SIGNING_ALLOWED=NO \
  ONLY_ACTIVE_ARCH=YES \
  ARCHS="$SIMULATOR_ARCH" \
  build
popd >/dev/null

APP_PATH="$DERIVED_DATA_PATH/Build/Products/${BUILD_CONFIGURATION}-iphonesimulator/TransportPlatform.app"
if [[ ! -d "$APP_PATH" ]]; then
  echo "Built app not found: $APP_PATH" >&2
  exit 1
fi

for simulator_udid in "${BOOTED_SIMULATORS[@]}"; do
  if ! xcrun simctl list devices available | grep -q "($simulator_udid) (Booted)"; then
    echo "Skipping simulator $simulator_udid because it is no longer booted." >&2
    continue
  fi

  echo "Installing on iOS Simulator $simulator_udid..."
  xcrun simctl uninstall "$simulator_udid" "$APP_ID" >/dev/null 2>&1 || true
  if ! xcrun simctl install "$simulator_udid" "$APP_PATH"; then
    echo "Failed to install on iOS Simulator $simulator_udid." >&2
    exit 1
  fi
  if ! xcrun simctl launch --terminate-running-process "$simulator_udid" "$APP_ID"; then
    echo "Installed but failed to launch on iOS Simulator $simulator_udid." >&2
    exit 1
  fi

  echo "Installed and launched Transport Platform on iOS Simulator $simulator_udid."
done
