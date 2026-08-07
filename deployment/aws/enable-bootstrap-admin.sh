#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCAL_ENV="${LOCAL_ENV:-$PROJECT_ROOT/.env.local}"
AWS_HOST="${AWS_HOST:-44.204.49.94}"
AWS_USER="${AWS_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/bookmyhotel-aws}"

value_of() {
  local key="$1"
  awk -F= -v wanted="$key" '$1 == wanted { sub(/^[^=]*=/, ""); print; exit }' "$LOCAL_ENV"
}

email="$(value_of APP_BOOTSTRAP_PLATFORM_ADMIN_EMAIL)"
password="$(value_of APP_BOOTSTRAP_PLATFORM_ADMIN_PASSWORD)"
[[ -n "$email" && -n "$password" ]] || {
  echo "Bootstrap email and password are required in $LOCAL_ENV." >&2
  exit 1
}

email_b64="$(printf '%s' "$email" | base64 | tr -d '\n')"
password_b64="$(printf '%s' "$password" | base64 | tr -d '\n')"

ssh -i "$SSH_KEY" "$AWS_USER@$AWS_HOST" bash -s -- "$email_b64" "$password_b64" <<'REMOTE'
set -euo pipefail
email="$(printf '%s' "$1" | base64 --decode)"
password="$(printf '%s' "$2" | base64 --decode)"
target=/opt/transport-platform/.env
temporary="$(mktemp)"
grep -v '^APP_BOOTSTRAP_PLATFORM_ADMIN_' "$target" > "$temporary" || true
{
  printf '%s\n' 'APP_BOOTSTRAP_PLATFORM_ADMIN_ENABLED=true'
  printf '%s\n' "APP_BOOTSTRAP_PLATFORM_ADMIN_EMAIL=$email"
  printf '%s\n' "APP_BOOTSTRAP_PLATFORM_ADMIN_PASSWORD=$password"
} >> "$temporary"
mv "$temporary" "$target"
chmod 600 "$target"
sudo systemctl restart transport-platform-backend.service
REMOTE

echo "AWS bootstrap platform admin is enabled and the service was restarted."
