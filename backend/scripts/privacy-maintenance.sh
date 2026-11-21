#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
jar="${PRIVACY_MAINTENANCE_JAR:-$root/target/transport-platform-backend-0.1.0-SNAPSHOT.jar}"
[[ -f "$jar" ]] || { echo 'Build the backend jar first, or set PRIVACY_MAINTENANCE_JAR.' >&2; exit 1; }
if (( $# == 0 )); then set -- --dry-run; fi
exec java -Dloader.main=com.transportplatform.tms.common.privacy.PrivacyMaintenanceCommand -cp "$jar" org.springframework.boot.loader.launch.PropertiesLauncher "$@"
