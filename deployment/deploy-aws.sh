#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export DEPLOY_ID="${DEPLOY_ID:-$(git -C "$ROOT" rev-parse HEAD)-$(date -u +%Y%m%d%H%M%S)}"
python3 "$ROOT/deployment/aws/validate-config.py"
(cd "$ROOT/backend" && mvn -B clean verify)
(cd "$ROOT/frontend" && npm ci && npm test && VITE_API_BASE_URL=/api npm run build)
bash "$ROOT/deployment/aws/deploy-backend.sh"
bash "$ROOT/deployment/aws/deploy-frontend.sh"
