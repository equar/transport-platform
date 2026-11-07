#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 "$ROOT/deployment/aws/validate-config.py" --target frontend
(cd "$ROOT/frontend" && npm ci && npm test && VITE_API_BASE_URL=/api npm run build)
exec bash "$ROOT/deployment/aws/deploy-frontend.sh"
