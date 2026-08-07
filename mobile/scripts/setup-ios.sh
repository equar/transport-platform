#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

MODE="full"
[[ "${1:-}" == "--check" ]] && MODE="check"

require_command node
require_command npm
require_command npx
require_command xcodebuild
require_command xcrun

if command -v pod >/dev/null 2>&1; then
  POD_CMD=(pod)
elif command -v bundle >/dev/null 2>&1 && bundle exec pod --version >/dev/null 2>&1; then
  POD_CMD=(bundle exec pod)
else
  echo "CocoaPods is required. Install it with: brew install cocoapods" >&2
  exit 1
fi

if [[ ! -d "$PROJECT_ROOT/ios" ]]; then
  echo "iOS native project is missing." >&2
  echo "Run: cd mobile && npx expo prebuild --platform ios" >&2
  exit 1
fi

echo "Xcode: $(xcodebuild -version | tr '\n' ' ')"
echo "CocoaPods: $("${POD_CMD[@]}" --version)"

if [[ "$MODE" == "check" ]]; then
  xcodebuild -workspace "$PROJECT_ROOT/ios/TransportPlatform.xcworkspace" -list >/dev/null
  echo "iOS setup check passed."
  exit 0
fi

ensure_node_modules
(cd "$PROJECT_ROOT/ios" && "${POD_CMD[@]}" install)
echo "iOS setup completed."
echo "Simulator: npm run ios"
echo "Physical device (local backend): DEVELOPMENT_TEAM=TEAMID LOCAL_API_BASE_URL=http://YOUR_LAN_IP:8087/api npm run ios:device -- --env local"
echo "Physical device (AWS backend): DEVELOPMENT_TEAM=TEAMID npm run ios:device -- --env aws"
