#!/usr/bin/env bash
set -euo pipefail
# Run once on the Transport host as root, then rerun when proxy settings change.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DOMAIN="${APP_DOMAIN:-transport.bakaroo.com}"
: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL for certificate registration}"
export APP_DOMAIN CERTBOT_EMAIL
[[ "$EUID" -eq 0 ]] || { echo 'Run setup-web-host.sh as root' >&2; exit 1; }
for command in certbot nginx envsubst curl python3; do
  command -v "$command" >/dev/null || { echo "Missing prerequisite: $command" >&2; exit 1; }
done
python3 - <<'PY'
import os,re
if not re.fullmatch(r'[a-z0-9]+(?:[.-][a-z0-9]+)*',os.environ['APP_DOMAIN']):
    raise SystemExit('Provide a valid transport DNS hostname')
if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',os.environ['CERTBOT_EMAIL']):
    raise SystemExit('Provide a valid Certbot contact email')
PY
work="$(mktemp -d)"
config=/etc/nginx/sites-available/transport-platform
link=/etc/nginx/sites-enabled/transport-platform
old_config=false
old_link=false
if [[ -e "$config" || -L "$config" ]]; then cp -a "$config" "$work/config"; old_config=true; fi
if [[ -e "$link" || -L "$link" ]]; then cp -a "$link" "$work/link"; old_link=true; fi
changed=false
cleanup() {
  status=$?
  trap - EXIT
  if [[ "$status" -ne 0 && "$changed" == true ]]; then
    rm -f "$link" "$config"
    if [[ "$old_config" == true ]]; then cp -a "$work/config" "$config"; fi
    if [[ "$old_link" == true ]]; then cp -a "$work/link" "$link"; fi
    if nginx -t; then systemctl reload nginx; else status=1; fi
  fi
  rm -rf "$work"
  exit "$status"
}
trap cleanup EXIT
install -d -m 755 /var/www/letsencrypt/.well-known/acme-challenge
# Install only Transport's HTTP challenge vhost until its certificate is available.
cat > "$work/http.conf" <<EOFHTTP
server {
    listen 80;
    listen [::]:80;
    server_name $APP_DOMAIN;
    location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
    location / { return 404; }
}
EOFHTTP
changed=true
if [[ ! -s /etc/letsencrypt/live/transport-platform/fullchain.pem ]]; then
  install -m 644 "$work/http.conf" "$config"
  ln -sfn "$config" "$link"
  nginx -t
  systemctl reload nginx
fi
# Reuse the existing Certbot account; this does not renew other applications.
certbot certonly --non-interactive --webroot -w /var/www/letsencrypt \
  --cert-name transport-platform --keep-until-expiring \
  --agree-tos --email "$CERTBOT_EMAIL" -d "$APP_DOMAIN" \
  --deploy-hook 'nginx -t && systemctl reload nginx'
envsubst '${APP_DOMAIN}' \
  < "$SCRIPT_DIR/../nginx-transport-platform.conf.template" > "$work/https.conf"
install -m 644 "$work/https.conf" "$config"
ln -sfn "$config" "$link"
nginx -t
systemctl reload nginx
for domain in "$APP_DOMAIN"; do
  curl --fail --silent --show-error --max-time 30 \
    --retry 12 --retry-all-errors --retry-delay 2 "https://$domain/health" >/dev/null
done
# Existing Certbot timers perform renewal; the certificate stores its deploy hook.
if ! systemctl is-enabled --quiet certbot.timer && ! systemctl is-enabled --quiet snap.certbot.renew.timer; then
  systemctl enable --now certbot.timer
fi
changed=false
echo 'Transport Nginx routing and verified HTTPS are ready'
