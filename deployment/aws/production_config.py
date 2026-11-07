"""Transport deployment validation and systemd EnvironmentFile serialization."""
import os
import re
from pathlib import Path
from urllib.parse import urlsplit

SECRET_KEYS = {
    'LIGHTSAIL_HOST', 'LIGHTSAIL_USER', 'LIGHTSAIL_SSH_KEY_B64', 'LIGHTSAIL_SSH_KEY',
    'LIGHTSAIL_KNOWN_HOSTS', 'MYSQL_PASSWORD', 'APP_SECURITY_JWT_SECRET',
    'APP_BOOTSTRAP_PLATFORM_ADMIN_PASSWORD', 'MICROSOFT_GRAPH_CLIENT_SECRET', 'EXPO_ACCESS_TOKEN',
}
DEFAULTS = {
    'APP_PUBLIC_URL': 'https://transport.bakaroo.com', 'VITE_API_BASE_URL': '/api',
    'MYSQL_PORT': '3306', 'MYSQL_DATABASE': 'transport_platform',
    'APP_SECURITY_ALLOWED_ORIGINS': 'https://transport.bakaroo.com',
    'APP_BOOTSTRAP_PLATFORM_ADMIN_ENABLED': 'false', 'APP_BOOTSTRAP_PLATFORM_ADMIN_EMAIL': '',
    'APP_BOOTSTRAP_PLATFORM_ADMIN_PASSWORD': '',
    'APP_EMAIL_ENABLED': 'false', 'APP_EMAIL_PROVIDER': 'logging', 'APP_EMAIL_FROM': '',
    'MICROSOFT_GRAPH_CLIENT_ID': '', 'MICROSOFT_GRAPH_TENANT_ID': '', 'MICROSOFT_GRAPH_CLIENT_SECRET': '',
    'APP_PUSH_ENABLED': 'false', 'APP_PUSH_PROVIDER': 'logging', 'EXPO_ACCESS_TOKEN': '',
    'APP_PUSH_EXPO_URL': 'https://exp.host/--/api/v2/push/send',
    'APP_LOGGING_LEVEL_ROOT': 'INFO', 'APP_LOGGING_LEVEL_APP': 'INFO',
    'APP_LOGGING_LEVEL_WEB': 'WARN', 'APP_LOGGING_LEVEL_SECURITY': 'INFO',
    'APP_LOGGING_LEVEL_SQL': 'WARN', 'APP_LOGGING_LEVEL_SQL_BIND': 'OFF',
    'VITE_GOOGLE_MAPS_API_KEY': '',
}
VARIABLE_KEYS = (set(DEFAULTS) | {'MYSQL_HOST', 'MYSQL_USER', 'APP_AUTH_PASSWORD_RESET_BASE_URL'}) - SECRET_KEYS
FIXED = {
    'SPRING_PROFILES_ACTIVE': 'prod', 'SERVER_PORT': '8082', 'SERVER_ADDRESS': '127.0.0.1',
    'SERVER_SERVLET_CONTEXT_PATH': '/api', 'SPRING_JPA_HIBERNATE_DDL_AUTO': 'validate',
    'SPRING_JPA_SHOW_SQL': 'false', 'SPRING_FLYWAY_ENABLED': 'true',
    'SPRING_FLYWAY_LOCATIONS': 'classpath:db/migration',
    'APP_DRIVER_DOCUMENT_STORAGE_ROOT': '/opt/transport-platform/documents/driver-documents',
    'APP_SECURITY_REFRESH_COOKIE_SECURE': 'true', 'APP_SECURITY_REFRESH_COOKIE_SAME_SITE': 'Lax',
    'APP_SECURITY_REFRESH_COOKIE_PATH': '/api/v1/auth',
}


def required(env, key):
    value = env.get(key, '').strip()
    if not value or value.startswith(('REPLACE_', 'YOUR_')):
        raise ValueError('Configure ' + key)
    return value


def public_origin(value, key):
    url = urlsplit(value)
    if (url.scheme != 'https' or not url.hostname or url.username or url.password
            or url.path or url.query or url.fragment
            or url.hostname in ('localhost', '127.0.0.1', '::1')):
        raise ValueError(key + ' must be a public HTTPS origin without a path or trailing slash')
    return value


def settings(environ=None, target='all', require_ssh=True):
    source = os.environ if environ is None else environ
    env = {key: source.get(key) or value for key, value in DEFAULTS.items()}
    env.update({key: value for key, value in source.items() if key in SECRET_KEYS | VARIABLE_KEYS})
    for key, value in env.items():
        if any(c in value for c in '\r\n\0') and key not in ('LIGHTSAIL_SSH_KEY', 'LIGHTSAIL_KNOWN_HOSTS'):
            raise ValueError('Multiline runtime setting: ' + key)
    public_origin(required(env, 'APP_PUBLIC_URL'), 'APP_PUBLIC_URL')
    if env['VITE_API_BASE_URL'] != '/api':
        raise ValueError('VITE_API_BASE_URL must be /api for the transport same-origin proxy')
    if require_ssh:
        if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9.-]*', required(env, 'LIGHTSAIL_HOST')):
            raise ValueError('Invalid LIGHTSAIL_HOST')
        if not re.fullmatch(r'[a-z_][a-z0-9_-]*', required(env, 'LIGHTSAIL_USER')):
            raise ValueError('Invalid LIGHTSAIL_USER')
        known_hosts_file = Path(source.get('SSH_KNOWN_HOSTS_FILE', '')).expanduser()
        if not env.get('LIGHTSAIL_KNOWN_HOSTS') and not known_hosts_file.is_file():
            raise ValueError('Configure LIGHTSAIL_KNOWN_HOSTS or SSH_KNOWN_HOSTS_FILE')
        key_file = Path(source.get('SSH_KEY', '')).expanduser()
        if not (env.get('LIGHTSAIL_SSH_KEY_B64') or env.get('LIGHTSAIL_SSH_KEY') or key_file.is_file()):
            raise ValueError('Configure LIGHTSAIL_SSH_KEY_B64, LIGHTSAIL_SSH_KEY or SSH_KEY')
    if target == 'frontend':
        return env
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9.-]*', required(env, 'MYSQL_HOST')):
        raise ValueError('MYSQL_HOST must be the database DNS hostname for TLS identity verification')
    if not env['MYSQL_PORT'].isdigit() or not 1 <= int(env['MYSQL_PORT']) <= 65535:
        raise ValueError('MYSQL_PORT is invalid')
    if env['MYSQL_DATABASE'] != 'transport_platform':
        raise ValueError('MYSQL_DATABASE must be transport_platform')
    for key in ('MYSQL_USER', 'MYSQL_PASSWORD', 'APP_SECURITY_JWT_SECRET'):
        required(env, key)
    if len(env['APP_SECURITY_JWT_SECRET'].encode()) < 32 or 'change-before' in env['APP_SECURITY_JWT_SECRET']:
        raise ValueError('APP_SECURITY_JWT_SECRET must contain at least 32 random bytes')
    origins = env['APP_SECURITY_ALLOWED_ORIGINS'].split(',')
    for origin in origins:
        public_origin(origin.strip(), 'APP_SECURITY_ALLOWED_ORIGINS')
    if env['APP_PUBLIC_URL'] not in {origin.strip() for origin in origins}:
        raise ValueError('APP_SECURITY_ALLOWED_ORIGINS must include APP_PUBLIC_URL')
    for key in ('APP_BOOTSTRAP_PLATFORM_ADMIN_ENABLED', 'APP_EMAIL_ENABLED', 'APP_PUSH_ENABLED'):
        if env[key] not in ('true', 'false'):
            raise ValueError(key + ' must be true or false')
    if env['APP_BOOTSTRAP_PLATFORM_ADMIN_ENABLED'] == 'true':
        required(env, 'APP_BOOTSTRAP_PLATFORM_ADMIN_EMAIL')
        if len(required(env, 'APP_BOOTSTRAP_PLATFORM_ADMIN_PASSWORD')) < 20:
            raise ValueError('Bootstrap password must contain at least 20 characters')
    if env['APP_EMAIL_ENABLED'] == 'true':
        if env['APP_EMAIL_PROVIDER'] != 'microsoft-graph':
            raise ValueError('Enabled email requires the implemented microsoft-graph provider')
        for key in ('APP_EMAIL_FROM', 'MICROSOFT_GRAPH_CLIENT_ID', 'MICROSOFT_GRAPH_TENANT_ID', 'MICROSOFT_GRAPH_CLIENT_SECRET'):
            required(env, key)
    elif env['APP_EMAIL_PROVIDER'] != 'logging':
        raise ValueError('Disabled email must use the logging provider')
    if env['APP_PUSH_ENABLED'] == 'true' and env['APP_PUSH_PROVIDER'] != 'expo':
        raise ValueError('Enabled push requires the expo provider')
    if env['APP_PUSH_ENABLED'] == 'false' and env['APP_PUSH_PROVIDER'] != 'logging':
        raise ValueError('Disabled push must use the logging provider')
    if env['APP_PUSH_EXPO_URL'] != DEFAULTS['APP_PUSH_EXPO_URL']:
        raise ValueError('Production push must use the official Expo HTTPS endpoint')
    reset = env.get('APP_AUTH_PASSWORD_RESET_BASE_URL') or env['APP_PUBLIC_URL'] + '/reset-password'
    if reset != env['APP_PUBLIC_URL'] + '/reset-password':
        raise ValueError('APP_AUTH_PASSWORD_RESET_BASE_URL must use APP_PUBLIC_URL/reset-password')
    env['APP_AUTH_PASSWORD_RESET_BASE_URL'] = reset
    # Prevent production logs from including bound passwords, reset tokens, or rider records.
    for key in ('APP_LOGGING_LEVEL_ROOT', 'APP_LOGGING_LEVEL_APP', 'APP_LOGGING_LEVEL_WEB', 'APP_LOGGING_LEVEL_SECURITY', 'APP_LOGGING_LEVEL_SQL', 'APP_LOGGING_LEVEL_SQL_BIND'):
        if env[key] not in ('INFO', 'WARN', 'ERROR', 'OFF'):
            raise ValueError(key + ' must not enable DEBUG or TRACE in production')
    return env


def runtime_settings(env):
    result = {key: env[key] for key in DEFAULTS if key.startswith(('APP_', 'MICROSOFT_', 'EXPO_'))}
    result.pop('APP_PUBLIC_URL', None)
    result['APP_AUTH_PASSWORD_RESET_BASE_URL'] = env['APP_AUTH_PASSWORD_RESET_BASE_URL']
    result.update(FIXED)
    result['SPRING_DATASOURCE_URL'] = (f"jdbc:mysql://{env['MYSQL_HOST']}:{env['MYSQL_PORT']}/transport_platform"
        '?sslMode=VERIFY_IDENTITY&allowPublicKeyRetrieval=false&serverTimezone=UTC')
    result['SPRING_DATASOURCE_USERNAME'] = env['MYSQL_USER']
    result['SPRING_DATASOURCE_PASSWORD'] = env['MYSQL_PASSWORD']
    result['APP_SECURITY_JWT_SECRET'] = env['APP_SECURITY_JWT_SECRET']
    return result


def write_environment(path, values):
    # systemd parses this file directly: never source/eval it as shell code.
    lines = []
    for key, value in sorted(values.items()):
        if not re.fullmatch(r'[A-Z][A-Z0-9_]*', key) or any(c in value for c in '\r\n\0'):
            raise ValueError('Invalid runtime setting: ' + key)
        escaped = value.replace('\\', '\\\\').replace('"', '\\"')
        lines.append(f'{key}="{escaped}"\n')
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(descriptor, 'w') as stream:
        stream.writelines(lines)
    os.chmod(path, 0o600)
