#!/usr/bin/env bash
set -euo pipefail

REPO="${GH_REPO:-equar/transport-platform}"
AWS_HOST="${AWS_HOST:-44.204.49.94}"
AWS_USER="${AWS_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/bookmyhotel-aws}"

command -v gh >/dev/null || { echo "GitHub CLI is required." >&2; exit 1; }
[[ -f "$SSH_KEY" ]] || { echo "SSH key not found: $SSH_KEY" >&2; exit 1; }
gh auth status >/dev/null

server_env="$(ssh -i "$SSH_KEY" "$AWS_USER@$AWS_HOST" 'sudo cat /opt/transport-platform/.env')"
value_of() {
  local key="$1"
  printf '%s\n' "$server_env" | awk -F= -v wanted="$key" '$1 == wanted { sub(/^[^=]*=/, ""); print; exit }'
}

database_url="$(value_of SPRING_DATASOURCE_URL)"
database_host="$(printf '%s' "$database_url" | sed -E 's#^jdbc:mysql://([^:/?]+).*#\1#')"
database_port="$(printf '%s' "$database_url" | sed -E 's#^jdbc:mysql://[^:/?]+:([0-9]+).*#\1#')"

printf '%s' "$(base64 < "$SSH_KEY" | tr -d '\n')" | gh secret set LIGHTSAIL_SSH_KEY_B64 --repo "$REPO"
printf '%s' "$(value_of SPRING_DATASOURCE_PASSWORD)" | gh secret set MYSQL_PASSWORD --repo "$REPO"
printf '%s' "$(value_of APP_SECURITY_JWT_SECRET)" | gh secret set APP_SECURITY_JWT_SECRET --repo "$REPO"
printf '%s' "$(value_of APP_BOOTSTRAP_PLATFORM_ADMIN_PASSWORD)" | gh secret set APP_BOOTSTRAP_PLATFORM_ADMIN_PASSWORD --repo "$REPO"
printf '%s' "$(value_of MICROSOFT_GRAPH_CLIENT_SECRET)" | gh secret set MICROSOFT_GRAPH_CLIENT_SECRET --repo "$REPO"

gh variable set LIGHTSAIL_HOST --body "$AWS_HOST" --repo "$REPO"
gh variable set LIGHTSAIL_USER --body "$AWS_USER" --repo "$REPO"
gh variable set MYSQL_HOST --body "$database_host" --repo "$REPO"
gh variable set MYSQL_PORT --body "$database_port" --repo "$REPO"
gh variable set MYSQL_DATABASE --body transport_platform --repo "$REPO"
gh variable set MYSQL_USER --body "$(value_of SPRING_DATASOURCE_USERNAME)" --repo "$REPO"
gh variable set SERVER_PORT --body 8087 --repo "$REPO"
gh variable set FRONTEND_PORT --body 3007 --repo "$REPO"
gh variable set APP_PUBLIC_URL --body https://transport.bakaroo.com --repo "$REPO"
gh variable set APP_SECURITY_ALLOWED_ORIGINS --body https://transport.bakaroo.com --repo "$REPO"
gh variable set APP_BOOTSTRAP_PLATFORM_ADMIN_ENABLED --body "$(value_of APP_BOOTSTRAP_PLATFORM_ADMIN_ENABLED)" --repo "$REPO"
gh variable set APP_BOOTSTRAP_PLATFORM_ADMIN_EMAIL --body "$(value_of APP_BOOTSTRAP_PLATFORM_ADMIN_EMAIL)" --repo "$REPO"
gh variable set APP_EMAIL_ENABLED --body "$(value_of APP_EMAIL_ENABLED)" --repo "$REPO"
gh variable set APP_EMAIL_PROVIDER --body "$(value_of APP_EMAIL_PROVIDER)" --repo "$REPO"
gh variable set APP_EMAIL_FROM --body "$(value_of APP_EMAIL_FROM)" --repo "$REPO"
gh variable set MICROSOFT_GRAPH_CLIENT_ID --body "$(value_of MICROSOFT_GRAPH_CLIENT_ID)" --repo "$REPO"
gh variable set MICROSOFT_GRAPH_TENANT_ID --body "$(value_of MICROSOFT_GRAPH_TENANT_ID)" --repo "$REPO"

echo "GitHub Actions deployment configuration synced to $REPO."
