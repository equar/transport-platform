#!/usr/bin/env bash
set -euo pipefail

DEPLOY_COMMON_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$DEPLOY_COMMON_DIR/../.." && pwd)"

AWS_HOST="${AWS_HOST:-44.204.49.94}"
AWS_USER="${AWS_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/bookmyhotel-aws}"
APP_DOMAIN="${APP_DOMAIN:-transport.bakaroo.com}"
BACKEND_PORT="${BACKEND_PORT:-8087}"
FRONTEND_PORT="${FRONTEND_PORT:-3007}"
BACKEND_HEALTH_ATTEMPTS="${BACKEND_HEALTH_ATTEMPTS:-240}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/opt/transport-platform}"
REMOTE_WEB_DIR="${REMOTE_WEB_DIR:-/var/www/transport-platform}"
DEPLOY_ID="${DEPLOY_ID:-$(date -u +%Y%m%d%H%M%S)}"
SERVER="$AWS_USER@$AWS_HOST"

SSH_OPTIONS=(-i "$SSH_KEY" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)

require_commands() {
  local commands=("$@")
  for command_name in "${commands[@]}"; do
    command -v "$command_name" >/dev/null || {
      echo "Required command is unavailable: $command_name" >&2
      exit 1
    }
  done
}

require_ssh_key() {
  [[ -f "$SSH_KEY" ]] || {
    echo "SSH key not found: $SSH_KEY" >&2
    exit 1
  }
}

create_staging_dir() {
  mktemp -d
}

check_remote_host() {
  echo "Checking AWS host..."
  ssh "${SSH_OPTIONS[@]}" "$SERVER" \
    "test -f '$REMOTE_APP_DIR/.env' && test -d '$REMOTE_APP_DIR' && sudo systemctl cat transport-platform-backend.service >/dev/null"
}

build_backend_artifact() {
  local output_path="$1"
  echo "Building and testing backend..."
  (
    cd "$PROJECT_ROOT/backend"
    mvn -B clean verify
  )

  local backend_jar
  backend_jar="$(find "$PROJECT_ROOT/backend/target" -maxdepth 1 -type f -name '*.jar' ! -name '*.original' -print -quit)"
  [[ -n "$backend_jar" ]] || {
    echo "Backend JAR was not produced." >&2
    exit 1
  }
  cp "$backend_jar" "$output_path"
}

build_frontend_artifact() {
  local output_path="$1"
  echo "Building frontend..."
  (
    cd "$PROJECT_ROOT/frontend"
    npm ci
    VITE_API_BASE_URL=/api npm run build
    COPYFILE_DISABLE=1 tar -czf "$output_path" -C dist .
  )
}

deploy_backend_artifact() {
  local backend_artifact="$1"
  local remote_backend="/tmp/transport-platform-backend-${DEPLOY_ID}.jar"

  echo "Uploading backend release $DEPLOY_ID..."
  scp "${SSH_OPTIONS[@]}" "$backend_artifact" "$SERVER:$remote_backend"

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

free_port() {
  local port="$1"
  local keep_pattern="${2:-}"
  local pids=""

  if command -v lsof >/dev/null 2>&1; then
    pids="$(sudo lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  elif command -v fuser >/dev/null 2>&1; then
    pids="$(sudo fuser -n tcp "$port" 2>/dev/null | tr ' ' '\n' | sed '/^$/d' || true)"
  else
    echo "Neither lsof nor fuser is available to inspect port $port." >&2
    exit 1
  fi

  [[ -n "$pids" ]] || return 0

  for pid in $pids; do
    local cmdline
    cmdline="$(sudo ps -p "$pid" -o args= 2>/dev/null || true)"
    if [[ -n "$keep_pattern" && "$cmdline" == *"$keep_pattern"* ]]; then
      continue
    fi
    echo "Stopping process on port $port: PID $pid :: $cmdline"
    sudo kill -TERM "$pid" 2>/dev/null || true
  done

  sleep 2

  if command -v lsof >/dev/null 2>&1 && sudo lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    for pid in $(sudo lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true); do
      local cmdline
      cmdline="$(sudo ps -p "$pid" -o args= 2>/dev/null || true)"
      if [[ -n "$keep_pattern" && "$cmdline" == *"$keep_pattern"* ]]; then
        continue
      fi
      echo "Force killing process on port $port: PID $pid :: $cmdline"
      sudo kill -KILL "$pid" 2>/dev/null || true
    done
  fi
}

free_port "$backend_port" "transport-platform-backend.service"
sudo systemctl stop transport-platform-backend.service || true
free_port "$backend_port" "transport-platform-backend.service"

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

  echo "Verifying public backend deployment..."
  curl -fsS --max-time 15 "https://$APP_DOMAIN/api/actuator/health" >/dev/null
  echo "Backend deployment $DEPLOY_ID completed successfully."
  echo "Backend: https://$APP_DOMAIN/api"
}

deploy_frontend_artifact() {
  local frontend_artifact="$1"
  local remote_frontend="/tmp/transport-platform-frontend-${DEPLOY_ID}.tar.gz"

  echo "Uploading frontend release $DEPLOY_ID..."
  scp "${SSH_OPTIONS[@]}" "$frontend_artifact" "$SERVER:$remote_frontend"

  echo "Activating frontend..."
  ssh "${SSH_OPTIONS[@]}" "$SERVER" bash -s -- \
    "$REMOTE_WEB_DIR" "$remote_frontend" "$DEPLOY_ID" "$FRONTEND_PORT" "$APP_DOMAIN" <<'REMOTE_FRONTEND'
set -euo pipefail
web_dir="$1"
uploaded_archive="$2"
deploy_id="$3"
frontend_port="$4"
app_domain="$5"
release_dir="${web_dir}.release-${deploy_id}"

free_port() {
  local port="$1"
  local keep_pattern="${2:-}"
  local pids=""

  if command -v lsof >/dev/null 2>&1; then
    pids="$(sudo lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  elif command -v fuser >/dev/null 2>&1; then
    pids="$(sudo fuser -n tcp "$port" 2>/dev/null | tr ' ' '\n' | sed '/^$/d' || true)"
  else
    echo "Neither lsof nor fuser is available to inspect port $port." >&2
    exit 1
  fi

  [[ -n "$pids" ]] || return 0

  for pid in $pids; do
    local cmdline
    cmdline="$(sudo ps -p "$pid" -o args= 2>/dev/null || true)"
    if [[ -n "$keep_pattern" && "$cmdline" == *"$keep_pattern"* ]]; then
      continue
    fi
    echo "Stopping process on port $port: PID $pid :: $cmdline"
    sudo kill -TERM "$pid" 2>/dev/null || true
  done

  sleep 2

  if command -v lsof >/dev/null 2>&1 && sudo lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    for pid in $(sudo lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true); do
      local cmdline
      cmdline="$(sudo ps -p "$pid" -o args= 2>/dev/null || true)"
      if [[ -n "$keep_pattern" && "$cmdline" == *"$keep_pattern"* ]]; then
        continue
      fi
      echo "Force killing process on port $port: PID $pid :: $cmdline"
      sudo kill -KILL "$pid" 2>/dev/null || true
    done
  fi
}

free_port "$frontend_port" "nginx: "

sudo mkdir -p "$release_dir"
sudo tar -xzf "$uploaded_archive" -C "$release_dir"
rm -f "$uploaded_archive"
sudo chown -R www-data:www-data "$release_dir"

sudo mkdir -p "$web_dir/assets"
if [[ -f "$release_dir/index.html" ]]; then
  sudo cp -f "$release_dir/index.html" "$web_dir/index.html"
fi
if [[ -f "$release_dir/favicon.ico" ]]; then
  sudo cp -f "$release_dir/favicon.ico" "$web_dir/favicon.ico"
fi
if [[ -d "$release_dir/assets" ]]; then
  sudo cp -a "$release_dir/assets/." "$web_dir/assets/"
fi
sudo chown -R www-data:www-data "$web_dir"
sudo rm -rf -- "$release_dir"

if ! sudo nginx -t; then
  echo "Nginx validation failed after frontend asset sync." >&2
  exit 1
fi
free_port "$frontend_port" "nginx: "
sudo systemctl reload nginx

healthy=false
for _ in $(seq 1 30); do
  if curl -fsS --max-time 5 -H "Host: ${app_domain}" "http://127.0.0.1:${frontend_port}/health" >/dev/null; then
    healthy=true
    break
  fi
  if curl -fsS --max-time 5 -H "Host: ${app_domain}" "http://127.0.0.1:${frontend_port}/" >/dev/null; then
    healthy=true
    break
  fi
  sleep 1
done

if [[ "$healthy" != true ]]; then
  sudo journalctl -u nginx --no-pager -n 120 >&2 || true
  echo "Frontend health check failed on port ${frontend_port} after nginx reload." >&2
  exit 1
fi
REMOTE_FRONTEND

  echo "Verifying public frontend deployment..."
  if ! curl -fsS --max-time 15 "https://$APP_DOMAIN/health" >/dev/null; then
    curl -fsS --max-time 15 "https://$APP_DOMAIN/" >/dev/null
  fi
  echo "Frontend deployment $DEPLOY_ID completed successfully."
  echo "Frontend: https://$APP_DOMAIN"
}
