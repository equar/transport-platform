#!/usr/bin/env bash
# Prepare the production workspace for Product > Archive; never upload or publish.
set -euo pipefail
REPOSITORY_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$REPOSITORY_ROOT/mobile/scripts/common.sh"

if (( $# > 0 )); then
  echo "Usage: ./prepareIosArchive.sh" >&2
  exit 64
fi
resolve_mobile_node
for command_name in npm npx xcodebuild xcrun osascript open; do
  require_command "$command_name"
done
apply_runtime_profile prod
configure_push_runtime_env
export EXPO_PUBLIC_API_BASE_URL="$(resolve_api_base_url aws ios-device)"
export NODE_ENV=production
export EXPO_APPLE_TEAM_ID="${EXPO_APPLE_TEAM_ID:-${DEVELOPMENT_TEAM:-$(node -p "require(process.argv[1]).expo.ios.appleTeamId || ''" "$PROJECT_ROOT/app.json")}}"
if [[ -z "$EXPO_APPLE_TEAM_ID" ]]; then
  echo "Set EXPO_APPLE_TEAM_ID to your Apple Developer Team ID." >&2
  exit 1
fi

# Quit gracefully before native files change. Never discard unsaved Xcode work.
if pgrep -x Xcode >/dev/null; then
  echo "Closing Xcode. Save any work if Xcode asks."
  osascript -e 'tell application "Xcode" to quit'
  for ((attempt=0; attempt<30; attempt++)); do
    if ! pgrep -x Xcode >/dev/null; then break; fi
    sleep 1
  done
  if pgrep -x Xcode >/dev/null; then
    echo "Xcode is still open. Save and close it, then rerun this script." >&2
    exit 1
  fi
fi

log_dir="$PROJECT_ROOT/.build/archive-preparation"
mkdir -p "$log_dir"
log_file="$log_dir/prepare-$(date +%Y%m%d-%H%M%S).log"
echo "Preparation log: $log_file"
(
  cd "$PROJECT_ROOT"
  echo "Installing locked JavaScript dependencies..."
  npm ci --include=dev --no-audit --no-fund
  echo "Applying iOS release configuration..."
  npx expo prebuild --platform ios --no-install
  "$PROJECT_ROOT/scripts/setup-ios.sh"
  cmp "$PROJECT_ROOT/ios/Podfile.lock" "$PROJECT_ROOT/ios/Pods/Manifest.lock"
  xcodebuild -workspace "$PROJECT_ROOT/ios/TransportPlatform.xcworkspace" -scheme TransportPlatform -list
) 2>&1 | tee "$log_file"

open "$PROJECT_ROOT/ios/TransportPlatform.xcworkspace"
echo "Ready: select TransportPlatform > Any iOS Device (arm64), then Product > Archive."
echo "No archive was uploaded or published."
