#!/usr/bin/env bash
# Executed on the Ubuntu host through sudo; never invoked by local startup.
set -euo pipefail
incoming="${1:?Pass the private staging directory}"
release_id="${2:?Pass the release ID}"
[[ "$incoming" =~ ^/home/[a-z_][a-z0-9_-]*/\.cache/transport-platform-deploy/transport-backend\.[a-zA-Z0-9]+$ && "$release_id" =~ ^[a-zA-Z0-9._-]{1,80}$ ]]
[[ "$EUID" -eq 0 ]] || { echo 'Backend activation requires root' >&2; exit 1; }
# Also serialize direct operator releases, not only GitHub workflow runs.
exec 9>/var/lock/transport-platform-deploy.lock
flock -w 300 9 || { echo 'Another Transport deployment holds the host lock' >&2; exit 1; }
app=/opt/transport-platform
service=transport-platform-backend.service
unit=/etc/systemd/system/$service
[[ "$(/usr/bin/java -version 2>&1)" == *'"25'* ]] || { echo 'Java 25 at /usr/bin/java is required' >&2; exit 1; }
# Never stop a different service or kill arbitrary listeners on a shared server.
legacy_user="$(systemctl show "$service" --property=User --value 2>/dev/null || true)"
if systemctl cat "$service" >/dev/null 2>&1 && [[ "$legacy_user" != transport ]]; then
  echo 'Existing transport service uses a different account. Follow the documented one-time dedicated-user cutover first.' >&2
  exit 1
fi
bash "$incoming/setup-rds-truststore.sh"
id transport >/dev/null 2>&1 || useradd --system --home "$app" --shell /usr/sbin/nologin transport
install -d -o root -g root -m 755 "$app" "$app/runtime"
install -d -o transport -g transport -m 750 "$app/logs" "$app/documents" "$app/documents/driver-documents"
previous_healthy=false
healthy() {
  # Readiness becomes UP only after ApplicationRunner/bootstrap has completed.
  for endpoint in health health/readiness; do
    curl -fsS --max-time 5 "http://127.0.0.1:8082/api/actuator/$endpoint" 2>/dev/null |
      python3 -c 'import json,sys;sys.exit(0 if json.load(sys.stdin).get("status")=="UP" else 1)' >/dev/null 2>&1 || return 1
  done
}
if systemctl is-active --quiet "$service" && healthy && [[ -f "$app/backend.jar" && -f "$app/.env" ]]; then
  previous_healthy=true
  cp -p "$app/backend.jar" "$app/backend.jar.previous"
  cp -p "$app/.env" "$app/.env.previous"
  cp -p "$unit" "$app/service.previous"
fi
rollback() {
  status=$?
  trap - EXIT
  if [[ "$status" != 0 ]]; then
    systemctl stop "$service" || true
    if [[ "$previous_healthy" == true ]]; then
      cp -p "$app/backend.jar.previous" "$app/backend.jar"
      cp -p "$app/.env.previous" "$app/.env"
      cp -p "$app/service.previous" "$unit"
      systemctl daemon-reload
      systemctl restart "$service" || true
      restored=false
      for _ in $(seq 1 60); do
        if healthy; then restored=true; break; fi
        sleep 2
      done
      if [[ "$restored" == true ]]; then echo 'Previous healthy JAR/environment/service restored.' >&2;
      else echo 'Rollback did not recover health; operator attention required.' >&2; fi
    else
      echo 'No healthy previous release to restore. The failed release is stopped.' >&2
    fi
  fi
  exit "$status"
}
trap rollback EXIT
systemctl stop "$service" || true
if [[ -n "$(ss -H -ltn 'sport = :8082')" ]]; then
  echo 'Port 8082 is still in use after stopping Transport; refusing to kill another service.' >&2
  exit 1
fi
install -o root -g root -m 644 "$incoming/backend.jar" "$app/backend.jar"
install -o root -g root -m 600 "$incoming/backend.env" "$app/.env"
install -o root -g root -m 644 "$incoming/transport-platform-backend.service" "$unit"
systemctl daemon-reload
systemctl enable "$service"
systemctl restart "$service"
for _ in $(seq 1 90); do
  if systemctl is-active --quiet "$service" && healthy; then
    printf '%s\n' "$release_id" > "$app/release-id"
    echo "Transport backend release $release_id is healthy."
    exit 0
  fi
  if systemctl is-failed --quiet "$service"; then break; fi
  sleep 2
done
python3 "$incoming/sanitize-logs.py" >&2 || true
echo 'Backend startup health check failed; database migrations are not reversed.' >&2
exit 1
