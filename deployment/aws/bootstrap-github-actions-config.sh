#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${1:-$SCRIPT_DIR/github-actions.env}"
REPO="${GH_REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)}"

[[ -n "$REPO" ]] || { echo "Set GH_REPO=owner/repository." >&2; exit 1; }
[[ -f "$ENV_FILE" ]] || { echo "Configuration not found: $ENV_FILE" >&2; exit 1; }
command -v gh >/dev/null || { echo "GitHub CLI is required." >&2; exit 1; }
gh auth status >/dev/null

SECRET_KEYS="LIGHTSAIL_SSH_KEY_B64 MYSQL_PASSWORD APP_SECURITY_JWT_SECRET APP_BOOTSTRAP_PLATFORM_ADMIN_PASSWORD MICROSOFT_GRAPH_CLIENT_SECRET"
VARIABLE_KEYS="LIGHTSAIL_HOST LIGHTSAIL_USER MYSQL_HOST MYSQL_PORT MYSQL_DATABASE MYSQL_USER SERVER_PORT FRONTEND_PORT APP_PUBLIC_URL APP_SECURITY_ALLOWED_ORIGINS APP_BOOTSTRAP_PLATFORM_ADMIN_ENABLED APP_BOOTSTRAP_PLATFORM_ADMIN_EMAIL APP_EMAIL_ENABLED APP_EMAIL_PROVIDER APP_EMAIL_FROM MICROSOFT_GRAPH_CLIENT_ID MICROSOFT_GRAPH_TENANT_ID"

contains() { case " $1 " in *" $2 "*) return 0 ;; *) return 1 ;; esac; }

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "${line//[[:space:]]/}" || "$line" == \#* ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  [[ "$line" == *"="* ]] || { echo "Malformed line for $key" >&2; exit 1; }
  [[ -n "$value" && "$value" != REPLACE_WITH_* ]] || { echo "Replace placeholder for $key" >&2; exit 1; }
  if contains "$SECRET_KEYS" "$key"; then
    printf '%s' "$value" | gh secret set "$key" --repo "$REPO"
  elif contains "$VARIABLE_KEYS" "$key"; then
    gh variable set "$key" --body "$value" --repo "$REPO"
  else
    echo "Unknown key: $key" >&2
    exit 1
  fi
done < "$ENV_FILE"

echo "GitHub deployment configuration applied to $REPO."
