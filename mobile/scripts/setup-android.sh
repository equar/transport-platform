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
resolve_android_sdk
resolve_android_java
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
require_command adb

if [[ ! -x "$PROJECT_ROOT/android/gradlew" ]]; then
  echo "Android native project or Gradle wrapper is missing." >&2
  echo "Run: cd mobile && npx expo prebuild --platform android" >&2
  exit 1
fi

echo "Node: $(node --version)"
echo "Java: $(java -version 2>&1 | head -n 1)"
echo "Android SDK: $ANDROID_HOME"

if [[ "$MODE" == "check" ]]; then
  (cd "$PROJECT_ROOT/android" && ./gradlew --version >/dev/null)
  echo "Android setup check passed."
  exit 0
fi

ensure_node_modules
(cd "$PROJECT_ROOT/android" && ./gradlew assembleDebug --no-daemon)
echo "Android setup and debug compilation completed."
echo "Emulator: npm run android"
echo "Physical device (local backend): npm run android:device -- --env local"
echo "Physical device (AWS backend): npm run android:device -- --env aws"
