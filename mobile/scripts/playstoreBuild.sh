#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

prepare_release_signing() {
  local bingo_key_properties="/Users/samuel/Projects2/bingo-platform/bingo-app/android/key.properties"
  local bingo_keystore="/Users/samuel/Projects2/bingo-platform/deployment/mobile/signing/bingo-app.jks"

  if [[ -f "$bingo_key_properties" ]]; then
    local key_props_file="$PROJECT_ROOT/android/key.properties"
    mkdir -p "$PROJECT_ROOT/android"
    cp "$bingo_key_properties" "$key_props_file"
    echo "Using the same release signing key as the bingo app: $bingo_keystore" >&2
    return 0
  fi

  local required_variables=(
    TRANSPORT_UPLOAD_STORE_FILE
    TRANSPORT_UPLOAD_STORE_PASSWORD
    TRANSPORT_UPLOAD_KEY_ALIAS
    TRANSPORT_UPLOAD_KEY_PASSWORD
  )

  local missing_variables=()
  local variable_name
  for variable_name in "${required_variables[@]}"; do
    if [[ -z "${!variable_name:-}" ]]; then
      missing_variables+=("$variable_name")
    fi
  done

  if (( ${#missing_variables[@]} > 0 )); then
    echo "Android Play Store builds require a release upload keystore." >&2
    printf 'Missing: %s\n' "${missing_variables[*]}" >&2
    echo "Example:" >&2
    echo "  export TRANSPORT_UPLOAD_STORE_FILE=~/keys/transport-upload.jks" >&2
    echo "  export TRANSPORT_UPLOAD_STORE_PASSWORD=..." >&2
    echo "  export TRANSPORT_UPLOAD_KEY_ALIAS=transport-upload" >&2
    echo "  export TRANSPORT_UPLOAD_KEY_PASSWORD=..." >&2
    exit 1
  fi

  local store_file="${TRANSPORT_UPLOAD_STORE_FILE/#\~/$HOME}"
  if [[ "$store_file" != /* ]]; then
    store_file="$PROJECT_ROOT/$store_file"
  fi

  if [[ ! -f "$store_file" ]]; then
    echo "Android upload keystore was not found: $store_file" >&2
    exit 1
  fi

  local key_props_file="$PROJECT_ROOT/android/key.properties"
  mkdir -p "$PROJECT_ROOT/android"
  cat > "$key_props_file" <<EOF
storeFile=$store_file
storePassword=${TRANSPORT_UPLOAD_STORE_PASSWORD}
keyAlias=${TRANSPORT_UPLOAD_KEY_ALIAS}
keyPassword=${TRANSPORT_UPLOAD_KEY_PASSWORD}
EOF
}

BUILD_NUMBER="${1:-}"
if [[ ! "$BUILD_NUMBER" =~ ^[1-9][0-9]*$ ]]; then
  echo "Usage: $0 <build-number>" >&2
  echo "Build number must be a positive integer greater than the current Play release." >&2
  exit 2
fi

prepare_release_signing
resolve_android_sdk
resolve_android_java

export AWS_API_BASE_URL="${AWS_API_BASE_URL:-$AWS_DEFAULT_API_BASE_URL}"
case "$AWS_API_BASE_URL" in
  https://*) ;;
  *)
    echo "Android Play Store releases require an HTTPS API URL: $AWS_API_BASE_URL" >&2
    exit 1
    ;;
esac

command -v curl >/dev/null || {
  echo "Missing required command: curl" >&2
  exit 1
}

curl -fsS --max-time 20 "${AWS_API_BASE_URL%/}/actuator/health" >/dev/null || {
  echo "AWS backend health check failed: ${AWS_API_BASE_URL%/}/actuator/health" >&2
  exit 1
}

export EXPO_PUBLIC_API_BASE_URL="$AWS_API_BASE_URL"
export NODE_ENV="production"

cd "$PROJECT_ROOT/android"
./gradlew bundleRelease --no-daemon -PtransportVersionCode="$BUILD_NUMBER" -PreactNativeArchitectures="arm64-v8a"

ARTIFACT_DIR="$PROJECT_ROOT/artifacts"
mkdir -p "$ARTIFACT_DIR"
ARTIFACT_PATH="$ARTIFACT_DIR/transport-platform-playstore-${BUILD_NUMBER}.aab"
SOURCE_AAB="$PROJECT_ROOT/android/app/build/outputs/bundle/release/app-release.aab"

if [[ ! -f "$SOURCE_AAB" ]]; then
  echo "AAB not found at $SOURCE_AAB" >&2
  exit 1
fi

cp "$SOURCE_AAB" "$ARTIFACT_PATH"
(cd "$ARTIFACT_DIR" && shasum -a 256 "$(basename "$ARTIFACT_PATH")" > "$(basename "$ARTIFACT_PATH").sha256")

echo "Built Android App Bundle for $AWS_API_BASE_URL"
echo "Artifact: $ARTIFACT_PATH"
echo "Checksum: $ARTIFACT_PATH.sha256"
echo "Before upload, verify the build number exceeds the latest Play Console version code."
