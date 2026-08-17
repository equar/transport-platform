#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/aws/deploy-common.sh"

require_commands ssh scp mvn curl
require_ssh_key

staging_dir="$(create_staging_dir)"
trap 'rm -rf -- "$staging_dir"' EXIT

backend_artifact="$staging_dir/transport-platform-backend.jar"

build_backend_artifact "$backend_artifact"
check_remote_host
deploy_backend_artifact "$backend_artifact"
