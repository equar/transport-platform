#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 "$ROOT/deployment/aws/validate-config.py" --target backend
(cd "$ROOT/backend" && mvn -B clean verify)
exec bash "$ROOT/deployment/aws/deploy-backend.sh"
