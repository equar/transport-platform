#!/usr/bin/env bash
set -euo pipefail
DEPLOY_COMMON_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$DEPLOY_COMMON_DIR/../.." && pwd)"
DEPLOY_ID="${DEPLOY_ID:-$(git -C "$PROJECT_ROOT" rev-parse HEAD)-$(date -u +%Y%m%d%H%M%S)}"
[[ "$DEPLOY_ID" =~ ^[a-zA-Z0-9._-]{1,80}$ ]] || { echo 'Invalid deployment ID' >&2; exit 1; }
: "${SSH_KEY:?Set SSH_KEY to a verified deployment key}"
: "${SSH_KNOWN_HOSTS_FILE:?Set SSH_KNOWN_HOSTS_FILE to verified known_hosts entries}"
SERVER="${SERVER:-${LIGHTSAIL_USER:?Set LIGHTSAIL_USER}@${LIGHTSAIL_HOST:?Set LIGHTSAIL_HOST}}"
[[ "$SERVER" =~ ^[a-z_][a-z0-9_-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]] || { echo 'Invalid SSH server' >&2; exit 1; }
[[ -f "$SSH_KEY" && -s "$SSH_KNOWN_HOSTS_FILE" ]] || { echo 'SSH key or verified known_hosts file is missing' >&2; exit 1; }
SSH_OPTIONS=(-i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$SSH_KNOWN_HOSTS_FILE")
health_check() {
  curl -fsS --max-time 15 "$1" | python3 -c 'import json,sys;sys.exit(0 if json.load(sys.stdin).get("status")=="UP" else 1)'
}
new_remote_directory() {
  local kind="$1" directory
  directory="$(ssh "${SSH_OPTIONS[@]}" "$SERVER" "
    set -e
    umask 077
    staging_directory=\"\$HOME/.cache/transport-platform-deploy\"
    install -d -m 700 \"\$staging_directory\"
    mktemp -d \"\$staging_directory/transport-$kind.XXXXXXXX\"
  ")"
  [[ "$directory" =~ ^/home/[a-z_][a-z0-9_-]*/\.cache/transport-platform-deploy/transport-(backend|frontend|setup)\.[a-zA-Z0-9]+$ ]] || { echo 'Unexpected remote staging directory' >&2; exit 1; }
  printf '%s' "$directory"
}
