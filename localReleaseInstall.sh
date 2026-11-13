#!/usr/bin/env bash
set -euo pipefail

REPOSITORY_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$REPOSITORY_ROOT/mobile"
ANDROID_PACKAGE="com.bakaroo.transport.app"
IOS_BUNDLE_ID="com.bakaroo.transport.app"
IOS_WORKSPACE="TransportPlatform.xcworkspace"
IOS_SCHEME="TransportPlatform"
IOS_APP_NAME="TransportPlatform.app"
TARGET_PLATFORM="${1:-both}"

usage() {
  echo "Usage: $(basename "$0") {android|ios|both}" >&2
}

if (( $# > 1 )); then
  usage
  exit 64
fi

case "$TARGET_PLATFORM" in
  android)
    install_android=true
    install_ios=false
    ;;
  ios)
    install_android=false
    install_ios=true
    ;;
  both)
    install_android=true
    install_ios=true
    ;;
  *)
    usage
    exit 64
    ;;
esac

# shellcheck disable=SC1091
source "$APP_DIR/scripts/common.sh"
apply_runtime_profile prod
resolve_mobile_node
require_command npm
ensure_node_modules
configure_push_runtime_env
export EXPO_PUBLIC_API_BASE_URL="$(resolve_api_base_url aws android-emulator)"
export NODE_ENV=production

android_devices=()
ios_devices=()
android_device_count=0
ios_device_count=0

if [[ "$install_android" == true ]]; then
  resolve_android_sdk
  resolve_android_java
  export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
  require_command adb
  adb start-server >/dev/null

  while IFS= read -r serial; do
    if [[ "$(adb -s "$serial" shell getprop ro.kernel.qemu </dev/null 2>/dev/null | tr -d '\r')" == "1" ]]; then
      android_devices+=("$serial")
      ((android_device_count += 1))
    fi
  done < <(adb devices | awk '$2 == "device" { print $1 }')
fi

if [[ "$install_ios" == true ]]; then
  require_command xcodebuild
  require_command xcrun

  while IFS= read -r identifier; do
    ios_devices+=("$identifier")
    ((ios_device_count += 1))
  done < <(
    xcrun simctl list devices booted |
      sed -nE 's/.*\(([0-9A-Fa-f-]{36})\) \(Booted\).*/\1/p'
  )
fi

if [[ "$install_android" == true && $android_device_count -eq 0 ]]; then
  echo "ERROR: No booted Android emulators were found." >&2
  exit 1
fi
if [[ "$install_ios" == true && $ios_device_count -eq 0 ]]; then
  echo "ERROR: No booted iOS simulators were found." >&2
  exit 1
fi

echo "Installing for $TARGET_PLATFORM: discovered $android_device_count booted Android emulator(s) and $ios_device_count booted iOS simulator(s)."
if [[ "$install_android" == true ]]; then
  for serial in "${android_devices[@]}"; do
    echo "  Android: $serial"
  done
fi
if [[ "$install_ios" == true ]]; then
  for identifier in "${ios_devices[@]}"; do
    echo "  iOS: $identifier"
  done
fi

failures=()
installed_android=0
installed_ios=0

if [[ "$install_android" == true ]]; then
  warn_if_android_push_native_config_missing
  echo "Building Android release APK with $EXPO_PUBLIC_API_BASE_URL..."
  (
    cd "$APP_DIR/android"
    ./gradlew assembleRelease --no-daemon -PtransportUsesCleartextTraffic=false
  )
  ANDROID_APK="$APP_DIR/android/app/build/outputs/apk/release/app-release.apk"
  if [[ ! -f "$ANDROID_APK" ]]; then
    echo "ERROR: Android release APK was not created: $ANDROID_APK" >&2
    exit 1
  fi

  for serial in "${android_devices[@]}"; do
    echo "Installing Android release on $serial..."
    if install_output="$(adb -s "$serial" install -r "$ANDROID_APK" 2>&1)"; then
      printf '%s\n' "$install_output"
    elif grep -Fq 'INSTALL_FAILED_UPDATE_INCOMPATIBLE' <<<"$install_output"; then
      printf '%s\n' "$install_output" >&2
      echo "Replacing incompatible prior signature on $serial for $ANDROID_PACKAGE..." >&2
      if ! adb -s "$serial" uninstall "$ANDROID_PACKAGE" ||
        ! adb -s "$serial" install "$ANDROID_APK"; then
        failures+=("Android $serial: replacement installation failed")
        continue
      fi
    else
      printf '%s\n' "$install_output" >&2
      failures+=("Android $serial: installation failed")
      continue
    fi

    if ! adb -s "$serial" shell monkey -p "$ANDROID_PACKAGE" -c android.intent.category.LAUNCHER 1 >/dev/null; then
      failures+=("Android $serial: app launch failed")
      continue
    fi
    if ! adb -s "$serial" shell dumpsys package "$ANDROID_PACKAGE" |
      grep -Eq 'versionCode=[0-9]+'; then
      failures+=("Android $serial: installed package verification failed")
      continue
    fi
    ((installed_android += 1))
  done
fi

if [[ "$install_ios" == true ]]; then
  if [[ ! -d "$APP_DIR/ios/Pods" ]]; then
    echo "ERROR: CocoaPods are not installed. Run: cd mobile && ./scripts/setup-ios.sh" >&2
    exit 1
  fi

  DERIVED_DATA_PATH="$APP_DIR/.build/local-release-install"
  echo "Building iOS simulator app with $EXPO_PUBLIC_API_BASE_URL..."
  (
    cd "$APP_DIR/ios"
    xcodebuild \
      -workspace "$IOS_WORKSPACE" \
      -scheme "$IOS_SCHEME" \
      -configuration Release \
      -sdk iphonesimulator \
      -destination 'generic/platform=iOS Simulator' \
      -derivedDataPath "$DERIVED_DATA_PATH" \
      CODE_SIGNING_ALLOWED=NO \
      build
  )
  IOS_APP="$DERIVED_DATA_PATH/Build/Products/Release-iphonesimulator/$IOS_APP_NAME"
  if [[ ! -d "$IOS_APP" ]]; then
    echo "ERROR: iOS simulator app was not created: $IOS_APP" >&2
    exit 1
  fi

  for identifier in "${ios_devices[@]}"; do
    echo "Installing iOS simulator app on $identifier..."
    if ! xcrun simctl install "$identifier" "$IOS_APP"; then
      failures+=("iOS $identifier: installation failed")
      continue
    fi
    if ! xcrun simctl launch --terminate-running-process "$identifier" "$IOS_BUNDLE_ID"; then
      failures+=("iOS $identifier: app launch failed")
      continue
    fi
    if ! xcrun simctl get_app_container "$identifier" "$IOS_BUNDLE_ID" app >/dev/null; then
      failures+=("iOS $identifier: installed app verification failed")
      continue
    fi
    ((installed_ios += 1))
  done
fi

echo "Installed production-configured builds on $installed_android Android emulator(s) and $installed_ios iOS simulator(s)."
if (( ${#failures[@]} > 0 )); then
  printf 'ERROR: Installation failed on %d virtual device(s):\n' "${#failures[@]}" >&2
  printf '  - %s\n' "${failures[@]}" >&2
  exit 1
fi
