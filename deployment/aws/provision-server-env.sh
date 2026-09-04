#!/usr/bin/env bash
set -euo pipefail

SOURCE_ENV=/opt/simplepay/.env
SOURCE_EMAIL_ENV=/opt/simplepay/.emailEnv
TARGET_ENV=/opt/transport-platform/.env

read_value() {
  local key="$1"
  local file
  for file in "$SOURCE_EMAIL_ENV" "$SOURCE_ENV"; do
    if [[ -f "$file" ]]; then
      local value
      value="$(awk -F= -v wanted="$key" '$1 == wanted { sub(/^[^=]*=/, ""); print; exit }' "$file")"
      if [[ -n "$value" ]]; then
        printf '%s' "$value"
        return 0
      fi
    fi
  done
  return 1
}

mysql_host="$(read_value MYSQL_HOST)"
mysql_port="$(read_value MYSQL_PORT || printf '3306')"
mysql_user="$(read_value MYSQL_USER)"
mysql_password="$(read_value MYSQL_PASSWORD)"

[[ -n "$mysql_host" && -n "$mysql_user" && -n "$mysql_password" ]] || {
  echo "Existing server database configuration is incomplete." >&2
  exit 1
}

MYSQL_PWD="$mysql_password" mysql \
  --host="$mysql_host" \
  --port="$mysql_port" \
  --user="$mysql_user" \
  --execute='CREATE DATABASE IF NOT EXISTS transport_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'

graph_client_id="$(read_value MICROSOFT_GRAPH_CLIENT_ID || true)"
graph_tenant_id="$(read_value MICROSOFT_GRAPH_TENANT_ID || true)"
graph_client_secret="$(read_value MICROSOFT_GRAPH_CLIENT_SECRET || true)"
email_from="$(read_value APP_EMAIL_FROM || read_value EMAIL_FROM || true)"

email_enabled=false
email_provider=logging
if [[ -n "$graph_client_id" && -n "$graph_tenant_id" && -n "$graph_client_secret" && -n "$email_from" ]]; then
  email_enabled=true
  email_provider=microsoft-graph
fi

push_enabled="$(read_value APP_PUSH_ENABLED || printf 'false')"
push_provider="$(read_value APP_PUSH_PROVIDER || printf 'logging')"
push_expo_url="$(read_value APP_PUSH_EXPO_URL || printf 'https://exp.host/--/api/v2/push/send')"
expo_access_token="$(read_value EXPO_ACCESS_TOKEN || true)"
bootstrap_email="$(read_value APP_BOOTSTRAP_PLATFORM_ADMIN_EMAIL || printf 'samuelweld2018@gmail.com')"
bootstrap_password="$(read_value APP_BOOTSTRAP_PLATFORM_ADMIN_PASSWORD || true)"

jwt_secret="$(openssl rand -base64 64 | tr -d '\n')"
umask 077
{
  printf '%s\n' 'SPRING_PROFILES_ACTIVE=prod'
  printf '%s\n' 'SERVER_PORT=8087'
  printf '%s\n' 'SERVER_SERVLET_CONTEXT_PATH=/api'
  printf '%s\n' "SPRING_DATASOURCE_URL=jdbc:mysql://${mysql_host}:${mysql_port}/transport_platform?useSSL=true&requireSSL=true&allowPublicKeyRetrieval=false&serverTimezone=UTC"
  printf '%s\n' "SPRING_DATASOURCE_USERNAME=${mysql_user}"
  printf '%s\n' "SPRING_DATASOURCE_PASSWORD=${mysql_password}"
  printf '%s\n' 'APP_SECURITY_ALLOWED_ORIGINS=https://transport.bakaroo.com'
  printf '%s\n' "APP_SECURITY_JWT_SECRET=${jwt_secret}"
  printf '%s\n' 'APP_BOOTSTRAP_PLATFORM_ADMIN_ENABLED=true'
  printf '%s\n' "APP_BOOTSTRAP_PLATFORM_ADMIN_EMAIL=${bootstrap_email}"
  if [[ -n "$bootstrap_password" ]]; then
    printf '%s\n' "APP_BOOTSTRAP_PLATFORM_ADMIN_PASSWORD=${bootstrap_password}"
  fi
  printf '%s\n' 'APP_LOGGING_LEVEL_ROOT=INFO'
  printf '%s\n' 'APP_LOGGING_LEVEL_APP=DEBUG'
  printf '%s\n' 'APP_LOGGING_LEVEL_WEB=DEBUG'
  printf '%s\n' 'APP_LOGGING_LEVEL_SECURITY=INFO'
  printf '%s\n' 'APP_LOGGING_LEVEL_SQL=INFO'
  printf '%s\n' 'APP_LOGGING_LEVEL_SQL_BIND=INFO'
  printf '%s\n' 'APP_DRIVER_DOCUMENT_STORAGE_ROOT=/opt/transport-platform/documents/driver-documents'
  printf '%s\n' "APP_EMAIL_ENABLED=${email_enabled}"
  printf '%s\n' "APP_EMAIL_PROVIDER=${email_provider}"
  printf '%s\n' "APP_EMAIL_FROM=${email_from}"
  printf '%s\n' "MICROSOFT_GRAPH_CLIENT_ID=${graph_client_id}"
  printf '%s\n' "MICROSOFT_GRAPH_TENANT_ID=${graph_tenant_id}"
  printf '%s\n' "MICROSOFT_GRAPH_CLIENT_SECRET=${graph_client_secret}"
  printf '%s\n' "APP_PUSH_ENABLED=${push_enabled}"
  printf '%s\n' "APP_PUSH_PROVIDER=${push_provider}"
  printf '%s\n' "APP_PUSH_EXPO_URL=${push_expo_url}"
  printf '%s\n' "EXPO_ACCESS_TOKEN=${expo_access_token}"
} > "${TARGET_ENV}.tmp"
mv "${TARGET_ENV}.tmp" "$TARGET_ENV"
chmod 600 "$TARGET_ENV"

echo "Created transport_platform schema and production environment."
echo "Microsoft Graph configured: $email_enabled"
