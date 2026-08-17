#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/aws/deploy-common.sh"

require_commands ssh scp npm tar curl
require_ssh_key

staging_dir="$(create_staging_dir)"
trap 'rm -rf -- "$staging_dir"' EXIT

frontend_artifact="$staging_dir/transport-platform-frontend.tar.gz"

build_frontend_artifact "$frontend_artifact"
check_remote_host
deploy_frontend_artifact "$frontend_artifact"
