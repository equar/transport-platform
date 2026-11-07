#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/deployment/aws/deploy-common.sh"
python3 "$ROOT/deployment/aws/validate-config.py" --target frontend
public_url="${APP_PUBLIC_URL:-https://transport.bakaroo.com}"
admin_url="${APP_ADMIN_URL:-https://admin.transport.bakaroo.com}"
[[ -s "$ROOT/frontend/dist/public/index.html" && -s "$ROOT/frontend/dist/admin/index.html" ]] || { echo 'Build the frontend before deployment.' >&2; exit 1; }
# Host routing and TLS are explicit one-time prerequisites, not mutated by each release.
for url in "$public_url" "$admin_url"; do curl -fsS --max-time 20 "$url/health" >/dev/null; done
health_check "$public_url/api/actuator/health"
work="$(mktemp -d)"
remote=''
cleanup() {
  status=$?
  trap - EXIT
  if [[ -n "$remote" ]]; then ssh "${SSH_OPTIONS[@]}" "$SERVER" "rm -rf -- '$remote'" || status=1; fi
  rm -rf -- "$work"
  exit "$status"
}
trap cleanup EXIT
cp -a "$ROOT/frontend/dist" "$work/site"
python3 - "$work/site/release.json" "$DEPLOY_ID" <<'PY'
import json,sys
from pathlib import Path
Path(sys.argv[1]).write_text(json.dumps({'release': sys.argv[2]})+'\n')
PY
COPYFILE_DISABLE=1 tar -czf "$work/frontend.tar.gz" -C "$work/site" .
remote="$(new_remote_directory frontend)"
scp "${SSH_OPTIONS[@]}" "$work/frontend.tar.gz" "$ROOT/deployment/aws/activate-frontend.sh" "$SERVER:$remote/"
ssh "${SSH_OPTIONS[@]}" "$SERVER" "sudo -n bash '$remote/activate-frontend.sh' '$remote' '$DEPLOY_ID'"
verified=false
for _ in $(seq 1 5); do
  if curl -fsS --max-time 15 "$public_url/release.json" |
       python3 -c 'import json,sys;sys.exit(0 if json.load(sys.stdin).get("release")==sys.argv[1] else 1)' "$DEPLOY_ID"; then
    if curl -fsS --max-time 15 "$public_url/" >/dev/null &&
       curl -fsS --max-time 15 "$admin_url/login" >/dev/null &&
       curl -fsS --max-time 15 "$admin_url/release.json" |
         python3 -c 'import json,sys;sys.exit(0 if json.load(sys.stdin).get("release")==sys.argv[1] else 1)' "$DEPLOY_ID"; then
      if health_check "$admin_url/api/actuator/health"; then verified=true; break; fi
    fi
  fi
  sleep 2
done
if [[ "$verified" != true ]]; then
  echo 'Public frontend verification failed; restoring the previous web root if present.' >&2
  ssh "${SSH_OPTIONS[@]}" "$SERVER" sudo -n bash -s -- "$DEPLOY_ID" <<'REMOTE'
set -euo pipefail
web=/var/www/transport-platform
expected="/var/www/transport-platform-releases/$1"
# Do not undo a different release activated by another operator.
if [[ "$(readlink -f "$web")" == "$expected" && -L "$web.previous" ]]; then
  previous="$(readlink -f "$web.previous")"
  [[ "$previous" == /var/www/transport-platform-releases/* && -s "$previous/index.html" ]]
  ln -s "$previous" "$web.rollback"
  mv -Tf "$web.rollback" "$web"
  echo 'Previous frontend restored.'
else
  echo 'No previous frontend to restore, or active release changed.' >&2
fi
REMOTE
  exit 1
fi
echo "Public and admin frontend release $DEPLOY_ID verified through HTTPS."
