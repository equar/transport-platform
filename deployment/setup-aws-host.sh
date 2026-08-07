#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
AWS_HOST="${AWS_HOST:-44.204.49.94}"
AWS_USER="${AWS_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/bookmyhotel-aws}"
APP_DOMAIN="${APP_DOMAIN:-transport.bakaroo.com}"
SERVER="${AWS_USER}@${AWS_HOST}"

[[ -f "$SSH_KEY" ]] || { echo "SSH key not found: $SSH_KEY" >&2; exit 1; }

rendered_config="$(mktemp)"
trap 'rm -f "$rendered_config"' EXIT
sed "s/__APP_DOMAIN__/$APP_DOMAIN/g" "$SCRIPT_DIR/nginx-transport-platform.conf.template" > "$rendered_config"

ssh -i "$SSH_KEY" "$SERVER" \
  'sudo mkdir -p /opt/transport-platform/logs /opt/transport-platform/documents/driver-documents /var/www/transport-platform && sudo chown -R ubuntu:ubuntu /opt/transport-platform && sudo chown -R www-data:www-data /var/www/transport-platform'
scp -i "$SSH_KEY" "$SCRIPT_DIR/transport-platform-backend.service" "$SERVER:/tmp/transport-platform-backend.service"
scp -i "$SSH_KEY" "$rendered_config" "$SERVER:/tmp/transport-platform"
ssh -i "$SSH_KEY" "$SERVER" \
  'sudo mv /tmp/transport-platform-backend.service /etc/systemd/system/transport-platform-backend.service && sudo mv /tmp/transport-platform /etc/nginx/sites-available/transport-platform && sudo ln -sfn /etc/nginx/sites-available/transport-platform /etc/nginx/sites-enabled/transport-platform && sudo systemctl daemon-reload && sudo systemctl enable transport-platform-backend.service && sudo nginx -t && sudo systemctl reload nginx'

echo "AWS host prepared for $APP_DOMAIN."
echo "Frontend: http://$APP_DOMAIN"
echo "Direct port: http://$APP_DOMAIN:3007"
echo "After DNS resolves, enable TLS with:"
echo "ssh -i $SSH_KEY $SERVER 'sudo certbot --nginx -d $APP_DOMAIN'"
