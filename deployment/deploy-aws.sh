#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

AWS_HOST="${AWS_HOST:-44.204.49.94}"
AWS_USER="${AWS_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/bookmyhotel-aws}"
APP_DOMAIN="${APP_DOMAIN:-transport.bakaroo.com}"
BACKEND_PORT="${BACKEND_PORT:-8087}"
BACKEND_HEALTH_ATTEMPTS="${BACKEND_HEALTH_ATTEMPTS:-240}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/opt/transport-platform}"
REMOTE_WEB_DIR="${REMOTE_WEB_DIR:-/var/www/transport-platform}"
DEPLOY_ID="$(date -u +%Y%m%d%H%M%S)"
SERVER="$AWS_USER@$AWS_HOST"

for command_name in ssh scp mvn npm tar curl; do
  command -v "$command_name" >/dev/null || {
    echo "Required command is unavailable: $command_name" >&2
    exit 1
  }
done

[[ -f "$SSH_KEY" ]] || {
  echo "SSH key not found: $SSH_KEY" >&2
  exit 1
}

STAGING_DIR="$(mktemp -d)"
trap 'rm -rf -- "$STAGING_DIR"' EXIT

SSH_OPTIONS=(-i "$SSH_KEY" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
BACKEND_ARTIFACT="$STAGING_DIR/transport-platform-backend.jar"
FRONTEND_ARTIFACT="$STAGING_DIR/transport-platform-frontend.tar.gz"

echo "Building and testing backend..."
(
  cd "$PROJECT_ROOT/backend"
  mvn -B clean verify
)

backend_jar="$(find "$PROJECT_ROOT/backend/target" -maxdepth 1 -type f -name '*.jar' ! -name '*.original' -print -quit)"
[[ -n "$backend_jar" ]] || {
  echo "Backend JAR was not produced." >&2
  exit 1
}
cp "$backend_jar" "$BACKEND_ARTIFACT"

echo "Building frontend..."
(
  cd "$PROJECT_ROOT/frontend"
  npm ci
  VITE_API_BASE_URL=/api npm run build
  COPYFILE_DISABLE=1 tar -czf "$FRONTEND_ARTIFACT" -C dist .
)

echo "Checking AWS host..."
ssh "${SSH_OPTIONS[@]}" "$SERVER" \
  "test -f '$REMOTE_APP_DIR/.env' && test -d '$REMOTE_APP_DIR' && sudo systemctl cat transport-platform-backend.service >/dev/null"

remote_backend="/tmp/transport-platform-backend-$DEPLOY_ID.jar"
remote_frontend="/tmp/transport-platform-frontend-$DEPLOY_ID.tar.gz"

echo "Uploading release $DEPLOY_ID..."
scp "${SSH_OPTIONS[@]}" "$BACKEND_ARTIFACT" "$SERVER:$remote_backend"
scp "${SSH_OPTIONS[@]}" "$FRONTEND_ARTIFACT" "$SERVER:$remote_frontend"

echo "Activating backend..."
ssh "${SSH_OPTIONS[@]}" "$SERVER" bash -s -- \
  "$REMOTE_APP_DIR" "$remote_backend" "$BACKEND_PORT" "$DEPLOY_ID" "$BACKEND_HEALTH_ATTEMPTS" <<'REMOTE_BACKEND'
set -euo pipefail
app_dir="$1"
uploaded_jar="$2"
backend_port="$3"
deploy_id="$4"
health_attempts="$5"
current_jar="$app_dir/backend.jar"
backup_jar="$app_dir/backend.jar.backup-$deploy_id"

if [[ -f "$current_jar" ]]; then
  cp "$current_jar" "$backup_jar"
fi
install -m 0644 "$uploaded_jar" "$current_jar"
rm -f "$uploaded_jar"
sudo systemctl restart transport-platform-backend.service

healthy=false
for _ in $(seq 1 "$health_attempts"); do
  if curl -fsS --max-time 5 "http://127.0.0.1:${backend_port}/api/actuator/health" >/dev/null; then
    healthy=true
    break
  fi
  sleep 2
done

if [[ "$healthy" != true ]]; then
  sudo journalctl -u transport-platform-backend.service --no-pager -n 120 >&2
  if [[ -f "$backup_jar" ]]; then
    cp "$backup_jar" "$current_jar"
    sudo systemctl restart transport-platform-backend.service
  fi
  echo "Backend health check failed; the previous JAR was restored." >&2
  exit 1
fi
REMOTE_BACKEND

echo "Activating frontend..."
ssh "${SSH_OPTIONS[@]}" "$SERVER" bash -s -- \
  "$REMOTE_WEB_DIR" "$remote_frontend" "$DEPLOY_ID" <<'REMOTE_FRONTEND'
set -euo pipefail
web_dir="$1"
uploaded_archive="$2"
deploy_id="$3"
release_dir="${web_dir}.release-${deploy_id}"
backup_dir="${web_dir}.backup-${deploy_id}"

sudo mkdir -p "$release_dir"
sudo tar -xzf "$uploaded_archive" -C "$release_dir"
rm -f "$uploaded_archive"
sudo chown -R www-data:www-data "$release_dir"

if [[ -d "$web_dir" ]]; then
  sudo mv "$web_dir" "$backup_dir"
fi
sudo mv "$release_dir" "$web_dir"

if ! sudo nginx -t; then
  sudo rm -rf -- "$web_dir"
  if [[ -d "$backup_dir" ]]; then
    sudo mv "$backup_dir" "$web_dir"
  fi
  echo "Nginx validation failed; the previous frontend was restored." >&2
  exit 1
fi
sudo systemctl reload nginx
REMOTE_FRONTEND

echo "Verifying public deployment..."
curl -fsS --max-time 15 "https://$APP_DOMAIN/health" >/dev/null
curl -fsS --max-time 15 "https://$APP_DOMAIN/api/actuator/health" >/dev/null

echo "Deployment $DEPLOY_ID completed successfully."
echo "Frontend: https://$APP_DOMAIN"
echo "Backend:  https://$APP_DOMAIN/api"
