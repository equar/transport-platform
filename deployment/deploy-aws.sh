#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ID="${DEPLOY_ID:-$(date -u +%Y%m%d%H%M%S)}"

echo "Running combined deployment using shared deploy id: $DEPLOY_ID"
"$SCRIPT_DIR/deploy-backend-aws.sh"
"$SCRIPT_DIR/deploy-frontend-aws.sh"

echo "Combined deployment completed successfully."
