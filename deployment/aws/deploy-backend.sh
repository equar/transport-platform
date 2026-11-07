#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/deployment/aws/deploy-common.sh"
python3 "$ROOT/deployment/aws/validate-config.py" --target backend
work="$(mktemp -d)"
umask 077
remote=''
cleanup() {
  status=$?
  trap - EXIT
  if [[ -n "$remote" ]]; then ssh "${SSH_OPTIONS[@]}" "$SERVER" "rm -rf -- '$remote'" || status=1; fi
  rm -rf -- "$work"
  exit "$status"
}
trap cleanup EXIT
python3 "$ROOT/deployment/aws/validate-config.py" --target backend --write-env "$work/backend.env"
jar="$ROOT/backend/target/transport-platform-backend-0.1.0-SNAPSHOT.jar"
[[ -s "$jar" ]] || { echo 'Build and verify the backend before deployment.' >&2; exit 1; }
remote="$(new_remote_directory backend)"
scp "${SSH_OPTIONS[@]}" "$jar" "$SERVER:$remote/backend.jar"
scp "${SSH_OPTIONS[@]}" "$work/backend.env" "$ROOT/deployment/transport-platform-backend.service" \
  "$ROOT/deployment/aws/activate-backend.sh" "$ROOT/deployment/aws/setup-rds-truststore.sh" \
  "$ROOT/deployment/aws/sanitize-logs.py" "$SERVER:$remote/"
ssh "${SSH_OPTIONS[@]}" "$SERVER" "sudo -n bash '$remote/activate-backend.sh' '$remote' '$DEPLOY_ID'"
health_check "${APP_PUBLIC_URL:-https://transport.bakaroo.com}/api/actuator/health"
echo "Backend release $DEPLOY_ID verified through public HTTPS."
