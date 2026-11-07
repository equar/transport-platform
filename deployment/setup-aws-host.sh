#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT/deployment/aws/deploy-common.sh"
: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL}"
APP_DOMAIN="${APP_DOMAIN:-transport.bakaroo.com}"
[[ "$APP_DOMAIN" =~ ^[a-z0-9]+([.-][a-z0-9]+)*$ && "$CERTBOT_EMAIL" =~ ^[^[:space:]\'\"]+@[^[:space:]\'\"]+$ ]] || { echo 'Invalid domain or certificate email' >&2; exit 1; }
remote="$(new_remote_directory setup)"
trap 'ssh "${SSH_OPTIONS[@]}" "$SERVER" "rm -rf -- '\''$remote'\''"' EXIT
# Preserve the relative layout consumed by setup-web-host.sh.
ssh "${SSH_OPTIONS[@]}" "$SERVER" "mkdir '$remote/aws'"
scp "${SSH_OPTIONS[@]}" "$ROOT/deployment/aws/setup-web-host.sh" "$SERVER:$remote/aws/"
scp "${SSH_OPTIONS[@]}" "$ROOT/deployment/nginx-transport-platform.conf.template" "$SERVER:$remote/"
ssh "${SSH_OPTIONS[@]}" "$SERVER" "sudo -n env APP_DOMAIN='$APP_DOMAIN' CERTBOT_EMAIL='$CERTBOT_EMAIL' bash '$remote/aws/setup-web-host.sh'"
