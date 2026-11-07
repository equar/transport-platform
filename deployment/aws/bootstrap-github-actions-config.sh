#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$SCRIPT_DIR/bootstrap-github-actions-config.py" "${1:-$SCRIPT_DIR/github-actions.env}"
